import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserCondition
from app.models.food import Food
from app.models.diet_plan import DietPlan, MealItem
from app.engines.nutrition_engine import NutritionEngine
from app.engines.health_rules import HealthRulesEngine
from app.schemas.nutrition import (
    DietPlanOut, FoodOut, FoodSafetyCheck, FoodSafetyResult,
    MealItemOut, MealSlotOut, MacroTargets
)

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

_nutrition_engine = NutritionEngine()
_rules_engine = HealthRulesEngine()


async def _get_user_or_404(user_id: uuid.UUID, db: AsyncSession) -> User:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/macros", response_model=MacroTargets)
async def get_macro_targets(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await _get_user_or_404(user_id, db)
    macros = await _nutrition_engine.get_macro_targets(user, db)
    return MacroTargets(**macros)


@router.get("/{user_id}/plan")
async def get_meal_plan(
    user_id: uuid.UUID,
    plan_date: date = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user_or_404(user_id, db)
    target_date = plan_date or date.today()

    plan = await _nutrition_engine.get_or_generate_plan(user, target_date, db)

    # Load meal items with foods
    result = await db.execute(
        select(MealItem)
        .where(MealItem.diet_plan_id == plan.id)
        .options(selectinload(MealItem.food))
    )
    items = result.scalars().all()

    # Group by slot
    slot_map: dict[str, list] = {}
    for item in items:
        if not item.food:
            continue
        ratio = item.quantity_g / item.food.serving_size_g
        meal_item_out = {
            "id": str(item.id),
            "food": {
                "id": str(item.food.id),
                "name": item.food.name,
                "name_local": item.food.name_local,
                "food_group": item.food.food_group,
                "serving_size_g": item.food.serving_size_g,
                "calories": item.food.calories,
                "protein_g": item.food.protein_g,
                "carbs_g": item.food.carbs_g,
                "fat_g": item.food.fat_g,
                "fiber_g": item.food.fiber_g,
                "sodium_mg": item.food.sodium_mg,
                "potassium_mg": item.food.potassium_mg,
                "glycemic_index": item.food.glycemic_index,
                "is_low_gi": item.food.is_low_gi,
                "is_high_fiber": item.food.is_high_fiber,
                "is_vegetarian": item.food.is_vegetarian,
                "is_vegan": item.food.is_vegan,
                "meal_tags": item.food.meal_tags,
                "cuisine_type": item.food.cuisine_type,
            },
            "meal_slot": item.meal_slot,
            "quantity_g": item.quantity_g,
            "reason_tags": item.reason_tags or [],
            "ai_reason": item.ai_reason,
            "calories": round(item.food.calories * ratio, 1),
            "protein_g": round(item.food.protein_g * ratio, 1),
            "carbs_g": round(item.food.carbs_g * ratio, 1),
            "fat_g": round(item.food.fat_g * ratio, 1),
        }
        slot_map.setdefault(item.meal_slot, []).append(meal_item_out)

    meals = []
    for slot in ["breakfast", "mid_morning", "lunch", "evening_snack", "dinner"]:
        slot_items = slot_map.get(slot, [])
        slot_cals = sum(i["calories"] for i in slot_items)
        slot_protein = sum(i["protein_g"] for i in slot_items)
        meals.append({
            "slot": slot,
            "items": slot_items,
            "slot_calories": round(slot_cals, 1),
            "slot_protein_g": round(slot_protein, 1),
        })

    macros = await _nutrition_engine.get_macro_targets(user, db)

    return {
        "id": str(plan.id),
        "plan_date": plan.plan_date.isoformat(),
        "total_calories": plan.total_calories,
        "total_protein_g": plan.total_protein_g,
        "total_carbs_g": plan.total_carbs_g,
        "total_fat_g": plan.total_fat_g,
        "total_fiber_g": plan.total_fiber_g,
        "ai_summary": plan.ai_summary,
        "meals": meals,
        "macro_targets": macros,
    }


@router.post("/{user_id}/plan/regenerate")
async def regenerate_plan(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await _get_user_or_404(user_id, db)
    today = date.today()

    # Delete existing plan
    result = await db.execute(
        select(DietPlan).where(DietPlan.user_id == user_id, DietPlan.plan_date == today)
    )
    existing = result.scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.commit()

    plan = await _nutrition_engine.generate_plan(user, today, db)
    return {"message": "Plan regenerated", "plan_id": str(plan.id)}


@router.post("/{user_id}/food-check", response_model=FoodSafetyResult)
async def check_food_safety(
    user_id: uuid.UUID,
    body: FoodSafetyCheck,
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user_or_404(user_id, db)
    food = await db.get(Food, body.food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    constraints = await _rules_engine.get_user_constraints(user_id, db)
    evaluation = _rules_engine.evaluate_food(food, constraints)

    return FoodSafetyResult(
        food_id=food.id,
        food_name=food.name,
        is_safe=evaluation.is_safe,
        score=evaluation.score,
        violations=[{"reason": v.reason, "severity": v.severity} for v in evaluation.violations],
        positive_tags=evaluation.positive_tags,
        recommendation=evaluation.recommendation,
    )


@router.get("/foods/search")
async def search_foods(
    q: str = Query(default=""),
    user_id: uuid.UUID = Query(default=None),
    limit: int = Query(default=20, le=50),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Food))
    all_foods = result.scalars().all()

    # Filter by query
    if q:
        q_lower = q.lower()
        all_foods = [
            f for f in all_foods
            if q_lower in f.name.lower() or (f.name_local and q_lower in f.name_local.lower())
        ]

    # If user_id provided, sort safe foods first
    if user_id:
        constraints = await _rules_engine.get_user_constraints(user_id, db)
        evaluated = [(f, _rules_engine.evaluate_food(f, constraints)) for f in all_foods]
        evaluated.sort(key=lambda x: (not x[1].is_safe, -x[1].score))
        foods_out = []
        for food, ev in evaluated[:limit]:
            foods_out.append({
                "id": str(food.id),
                "name": food.name,
                "name_local": food.name_local,
                "food_group": food.food_group,
                "calories": food.calories,
                "protein_g": food.protein_g,
                "carbs_g": food.carbs_g,
                "fat_g": food.fat_g,
                "fiber_g": food.fiber_g,
                "glycemic_index": food.glycemic_index,
                "is_safe": ev.is_safe,
                "safety_score": ev.score,
                "positive_tags": ev.positive_tags,
                "violations": [{"reason": v.reason} for v in ev.violations],
            })
        return {"foods": foods_out, "total": len(all_foods)}

    foods_out = [{
        "id": str(f.id),
        "name": f.name,
        "name_local": f.name_local,
        "food_group": f.food_group,
        "calories": f.calories,
        "protein_g": f.protein_g,
        "carbs_g": f.carbs_g,
        "fat_g": f.fat_g,
        "fiber_g": f.fiber_g,
        "glycemic_index": f.glycemic_index,
    } for f in all_foods[:limit]]
    return {"foods": foods_out, "total": len(all_foods)}
