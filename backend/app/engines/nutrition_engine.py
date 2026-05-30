"""
Nutrition Engine — generates personalized meal plans.

Algorithm: greedy slot-filling with health-rules-filtered food pool.
"""
from __future__ import annotations

import random
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.engines.health_rules import HealthRulesEngine, UserConstraints
from app.models.diet_plan import DietPlan, MealItem
from app.models.food import Food
from app.models.user import User, UserGoal, UserCondition
from app.utils.calculators import (
    calculate_bmr,
    calculate_macros,
    calculate_target_calories,
    calculate_tdee,
)

if TYPE_CHECKING:
    import uuid

MEAL_SLOTS = ["breakfast", "mid_morning", "lunch", "evening_snack", "dinner"]

SLOT_CALORIE_DISTRIBUTION = {
    "breakfast": 0.25,
    "mid_morning": 0.10,
    "lunch": 0.35,
    "evening_snack": 0.10,
    "dinner": 0.20,
}

# CKD protein cap: 0.75g/kg (middle of 0.6-0.8 range)
CKD_PROTEIN_FACTOR = 0.75


class NutritionEngine:

    def __init__(self, rules_engine: HealthRulesEngine | None = None):
        self.rules_engine = rules_engine or HealthRulesEngine()

    async def get_or_generate_plan(
        self, user: User, plan_date: date, db: AsyncSession
    ) -> DietPlan:
        """Return existing plan for date or generate a new one."""
        result = await db.execute(
            select(DietPlan).where(
                DietPlan.user_id == user.id,
                DietPlan.plan_date == plan_date,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        return await self.generate_plan(user, plan_date, db)

    async def generate_plan(
        self, user: User, plan_date: date, db: AsyncSession
    ) -> DietPlan:
        """Generate a new meal plan from scratch."""
        # Load primary goal
        goal_result = await db.execute(
            select(UserGoal).where(UserGoal.user_id == user.id, UserGoal.is_primary == True)
        )
        goal = goal_result.scalar_one_or_none()
        goal_type = goal.goal_type if goal else "maintenance"

        # Check for CKD (protein cap)
        cond_result = await db.execute(
            select(UserCondition).join(UserCondition.condition).where(
                UserCondition.user_id == user.id
            )
        )
        user_conditions = cond_result.scalars().all()
        has_ckd = any(
            getattr(uc.condition, "code", "") == "CKD"
            for uc in user_conditions
        )

        # Calculate targets
        bmr = calculate_bmr(
            user.weight_kg or 70,
            user.height_cm or 170,
            user.age or 30,
            user.gender or "other",
        )
        tdee = calculate_tdee(bmr, user.activity_level or "moderate")
        target_calories = calculate_target_calories(tdee, goal_type, user.gender or "other")

        protein_override = (user.weight_kg or 70) * CKD_PROTEIN_FACTOR if has_ckd else None
        macros = calculate_macros(target_calories, goal_type, user.weight_kg or 70, protein_override)

        # Load constraints
        constraints = await self.rules_engine.get_user_constraints(user.id, db)

        # Load all foods
        foods_result = await db.execute(select(Food))
        all_foods = list(foods_result.scalars().all())

        # Build meal items
        meal_items_data: list[dict] = []
        for slot in MEAL_SLOTS:
            slot_calories = target_calories * SLOT_CALORIE_DISTRIBUTION[slot]
            items = self._fill_slot(slot, slot_calories, all_foods, constraints, macros)
            meal_items_data.extend(items)

        # Create DietPlan
        total_cals = sum(i["calories"] for i in meal_items_data)
        total_protein = sum(i["protein_g"] for i in meal_items_data)
        total_carbs = sum(i["carbs_g"] for i in meal_items_data)
        total_fat = sum(i["fat_g"] for i in meal_items_data)
        total_fiber = sum(i.get("fiber_g", 0) for i in meal_items_data)

        plan = DietPlan(
            user_id=user.id,
            plan_date=plan_date,
            total_calories=round(total_cals, 1),
            total_protein_g=round(total_protein, 1),
            total_carbs_g=round(total_carbs, 1),
            total_fat_g=round(total_fat, 1),
            total_fiber_g=round(total_fiber, 1),
        )
        db.add(plan)
        await db.flush()  # get plan.id

        for item_data in meal_items_data:
            mi = MealItem(
                diet_plan_id=plan.id,
                food_id=item_data["food_id"],
                meal_slot=item_data["slot"],
                quantity_g=item_data["quantity_g"],
                reason_tags=item_data.get("reason_tags", []),
            )
            db.add(mi)

        await db.commit()
        await db.refresh(plan)
        return plan

    def _fill_slot(
        self,
        slot: str,
        target_calories: float,
        all_foods: list[Food],
        constraints: UserConstraints,
        macros: dict,
    ) -> list[dict]:
        """Greedy slot-filling: pick safe foods until calorie target is met."""
        safe_foods = self.rules_engine.filter_safe_foods(all_foods, constraints, slot)
        if not safe_foods:
            # Fall back: no slot filter
            safe_foods = self.rules_engine.filter_safe_foods(all_foods, constraints)
        if not safe_foods:
            return []

        items: list[dict] = []
        remaining_calories = target_calories

        # Pick 1-3 foods per slot
        max_foods = 3 if slot in ("lunch", "dinner") else 2
        picks = safe_foods[:min(max_foods * 3, len(safe_foods))]  # pool to pick from
        random.shuffle(picks)  # introduce variety
        picks = picks[:max_foods]

        if not picks:
            return []

        # Distribute calories proportionally across picks (equal split for now)
        per_food_calories = remaining_calories / len(picks)

        for food, evaluation in picks:
            if food.calories <= 0:
                continue
            # Quantity to hit per_food_calories
            quantity_g = (per_food_calories / food.calories) * food.serving_size_g
            quantity_g = max(30.0, min(quantity_g, 400.0))  # clamp to realistic portions

            ratio = quantity_g / food.serving_size_g
            tags = [t.text for t in self.rules_engine.generate_explanation_tags(food, constraints)]

            items.append({
                "food_id": food.id,
                "slot": slot,
                "quantity_g": round(quantity_g, 1),
                "calories": round(food.calories * ratio, 1),
                "protein_g": round(food.protein_g * ratio, 1),
                "carbs_g": round(food.carbs_g * ratio, 1),
                "fat_g": round(food.fat_g * ratio, 1),
                "fiber_g": round((food.fiber_g or 0) * ratio, 1),
                "reason_tags": tags,
            })

        return items

    async def get_macro_targets(self, user: User, db: AsyncSession) -> dict:
        goal_result = await db.execute(
            select(UserGoal).where(UserGoal.user_id == user.id, UserGoal.is_primary == True)
        )
        goal = goal_result.scalar_one_or_none()
        goal_type = goal.goal_type if goal else "maintenance"

        bmr = calculate_bmr(
            user.weight_kg or 70,
            user.height_cm or 170,
            user.age or 30,
            user.gender or "other",
        )
        tdee = calculate_tdee(bmr, user.activity_level or "moderate")
        target_calories = calculate_target_calories(tdee, goal_type, user.gender or "other")
        return calculate_macros(target_calories, goal_type, user.weight_kg or 70)
