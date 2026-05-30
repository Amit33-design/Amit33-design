"""
Health Rules Engine — multi-constraint optimizer.

Loads all condition-specific food rules for a user, merges them using
Most Restrictive Wins, and evaluates individual foods or full day plans.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.condition import ConditionFoodRule, MedicalCondition
from app.models.food import Food
from app.models.user import UserCondition

if TYPE_CHECKING:
    import uuid


@dataclass
class NutrientThreshold:
    nutrient: str
    max_per_day: float | None = None
    min_per_day: float | None = None
    max_per_serving: float | None = None


@dataclass
class UserConstraints:
    user_id: "uuid.UUID"
    condition_codes: list[str] = field(default_factory=list)
    avoid_food_groups: list[str] = field(default_factory=list)
    limit_food_groups: list[str] = field(default_factory=list)
    recommend_flags: list[str] = field(default_factory=list)       # e.g., 'is_low_gi', 'is_high_fiber'
    nutrient_thresholds: dict[str, NutrientThreshold] = field(default_factory=dict)
    avoid_food_ids: list["uuid.UUID"] = field(default_factory=list)
    # Raw rules for explanation generation
    raw_rules: list[ConditionFoodRule] = field(default_factory=list)


@dataclass
class RuleViolation:
    condition_code: str
    rule_type: str
    reason: str
    severity: str  # HARD_BLOCK | SOFT_LIMIT | WARNING


@dataclass
class FoodEvaluation:
    food_id: "uuid.UUID"
    food_name: str
    is_safe: bool
    score: float  # 0.0 = worst, 1.0 = best
    violations: list[RuleViolation]
    positive_tags: list[str]
    recommendation: str


@dataclass
class ExplanationTag:
    icon: str
    text: str
    relevance: str  # condition code or 'general'


class HealthRulesEngine:

    async def get_user_constraints(self, user_id: "uuid.UUID", db: AsyncSession) -> UserConstraints:
        """Load and merge all condition rules for a user. Most Restrictive Wins."""
        result = await db.execute(
            select(UserCondition)
            .where(UserCondition.user_id == user_id)
            .options(selectinload(UserCondition.condition).selectinload(MedicalCondition.rules))
        )
        user_conditions = result.scalars().all()

        constraints = UserConstraints(user_id=user_id)

        for uc in user_conditions:
            condition = uc.condition
            if not condition:
                continue
            constraints.condition_codes.append(condition.code)

            for rule in condition.rules:
                constraints.raw_rules.append(rule)
                self._apply_rule(rule, constraints)

        return constraints

    def _apply_rule(self, rule: ConditionFoodRule, constraints: UserConstraints) -> None:
        scope = rule.scope
        rule_type = rule.rule_type
        tv = rule.target_value  # target_value JSONB dict

        if scope == "FOOD_GROUP":
            group = tv.get("food_group", "")
            if rule_type == "AVOID" and group not in constraints.avoid_food_groups:
                constraints.avoid_food_groups.append(group)
            elif rule_type == "LIMIT" and group not in constraints.limit_food_groups:
                constraints.limit_food_groups.append(group)

        elif scope == "FOOD_FLAG":
            flag = tv.get("flag", "")
            if rule_type in ("RECOMMEND", "REQUIRE") and flag not in constraints.recommend_flags:
                constraints.recommend_flags.append(flag)

        elif scope == "NUTRIENT_THRESHOLD":
            nutrient = tv.get("nutrient", "")
            if nutrient not in constraints.nutrient_thresholds:
                constraints.nutrient_thresholds[nutrient] = NutrientThreshold(nutrient=nutrient)
            existing = constraints.nutrient_thresholds[nutrient]

            # Most Restrictive Wins
            if "max_per_day" in tv:
                new_max = float(tv["max_per_day"])
                if existing.max_per_day is None or new_max < existing.max_per_day:
                    existing.max_per_day = new_max

            if "min_per_day" in tv:
                new_min = float(tv["min_per_day"])
                if existing.min_per_day is None or new_min > existing.min_per_day:
                    existing.min_per_day = new_min

            if "max_per_serving" in tv:
                new_max_s = float(tv["max_per_serving"])
                if existing.max_per_serving is None or new_max_s < existing.max_per_serving:
                    existing.max_per_serving = new_max_s

        elif scope == "SPECIFIC_FOOD":
            food_id = tv.get("food_id")
            if food_id and rule_type == "AVOID":
                import uuid as _uuid
                try:
                    constraints.avoid_food_ids.append(_uuid.UUID(str(food_id)))
                except ValueError:
                    pass

    def evaluate_food(self, food: Food, constraints: UserConstraints) -> FoodEvaluation:
        """Evaluate a food against all constraints. Returns score 0-1 and violations."""
        violations: list[RuleViolation] = []
        positive_tags: list[str] = []
        penalty = 0.0

        # --- Hard blocks ---
        if food.id in constraints.avoid_food_ids:
            violations.append(RuleViolation(
                condition_code="SPECIFIC",
                rule_type="AVOID",
                reason="This specific food is flagged for avoidance",
                severity="HARD_BLOCK",
            ))

        if food.food_group and food.food_group in constraints.avoid_food_groups:
            # Find the reason from raw rules
            reason = self._find_rule_reason(constraints, "FOOD_GROUP", food.food_group)
            violations.append(RuleViolation(
                condition_code="",
                rule_type="AVOID",
                reason=reason or f"Food group '{food.food_group}' should be avoided",
                severity="HARD_BLOCK",
            ))
            penalty += 1.0

        if food.food_group and food.food_group in constraints.limit_food_groups:
            reason = self._find_rule_reason(constraints, "FOOD_GROUP", food.food_group)
            violations.append(RuleViolation(
                condition_code="",
                rule_type="LIMIT",
                reason=reason or f"Food group '{food.food_group}' should be limited",
                severity="SOFT_LIMIT",
            ))
            penalty += 0.4

        # --- Nutrient per-serving checks ---
        for nutrient, threshold in constraints.nutrient_thresholds.items():
            if threshold.max_per_serving is not None:
                food_val = getattr(food, nutrient, None)
                if food_val is not None and food_val > threshold.max_per_serving:
                    violations.append(RuleViolation(
                        condition_code="",
                        rule_type="LIMIT",
                        reason=f"{nutrient.replace('_', ' ')} ({food_val:.0f}) exceeds per-serving limit ({threshold.max_per_serving:.0f})",
                        severity="SOFT_LIMIT",
                    ))
                    penalty += 0.5

        # --- Recommended flags (positive scoring) ---
        for flag in constraints.recommend_flags:
            flag_val = getattr(food, flag, None)
            if flag_val is True:
                tag_text = flag.replace("is_", "").replace("_", " ").title()
                positive_tags.append(tag_text)
            elif flag_val is False:
                penalty += 0.1  # mild penalty for not having recommended flag

        # --- Always-positive tags regardless of constraints ---
        if food.is_low_gi and food.glycemic_index is not None:
            positive_tags.append("Low GI")
        if food.is_high_fiber:
            positive_tags.append("High Fiber")
        if food.is_low_sodium:
            positive_tags.append("Low Sodium")
        if food.is_low_oxalate:
            positive_tags.append("Low Oxalate")
        if food.is_vegan:
            positive_tags.append("Vegan")
        elif food.is_vegetarian:
            positive_tags.append("Vegetarian")

        # Deduplicate
        positive_tags = list(dict.fromkeys(positive_tags))

        is_safe = not any(v.severity == "HARD_BLOCK" for v in violations)
        score = max(0.0, 1.0 - penalty)

        if not is_safe:
            recommendation = "Avoid this food based on your health conditions."
        elif violations:
            recommendation = "Use in moderation. Check with your healthcare provider."
        elif score > 0.7 and positive_tags:
            recommendation = f"Recommended: {', '.join(positive_tags[:3])}."
        else:
            recommendation = "Generally safe for your profile."

        return FoodEvaluation(
            food_id=food.id,
            food_name=food.name,
            is_safe=is_safe,
            score=score,
            violations=violations,
            positive_tags=positive_tags,
            recommendation=recommendation,
        )

    def filter_safe_foods(
        self,
        food_pool: list[Food],
        constraints: UserConstraints,
        meal_slot: str | None = None,
    ) -> list[tuple[Food, FoodEvaluation]]:
        """Return list of (food, evaluation) tuples — safe only, sorted by score desc."""
        evaluated = [(f, self.evaluate_food(f, constraints)) for f in food_pool]
        safe = [(f, ev) for f, ev in evaluated if ev.is_safe]

        # Filter by meal slot tags if provided
        if meal_slot:
            slot_safe = [(f, ev) for f, ev in safe if not f.meal_tags or meal_slot in f.meal_tags]
            # Fall back to all safe foods if slot filter leaves nothing
            if slot_safe:
                safe = slot_safe

        safe.sort(key=lambda x: x[1].score, reverse=True)
        return safe

    def evaluate_day_plan(
        self,
        meal_items_with_foods: list[tuple["MealItem", Food]],  # noqa: F821
        constraints: UserConstraints,
    ) -> list[RuleViolation]:
        """Check aggregate daily nutrient totals against threshold rules."""
        daily_totals: dict[str, float] = {}

        for item, food in meal_items_with_foods:
            ratio = item.quantity_g / food.serving_size_g
            for nutrient in constraints.nutrient_thresholds:
                val = getattr(food, nutrient, None)
                if val is not None:
                    daily_totals[nutrient] = daily_totals.get(nutrient, 0.0) + val * ratio

        violations: list[RuleViolation] = []
        for nutrient, threshold in constraints.nutrient_thresholds.items():
            actual = daily_totals.get(nutrient, 0.0)
            if threshold.max_per_day and actual > threshold.max_per_day:
                violations.append(RuleViolation(
                    condition_code="",
                    rule_type="LIMIT",
                    reason=f"Daily {nutrient.replace('_', ' ')} {actual:.0f} exceeds limit {threshold.max_per_day:.0f}",
                    severity="WARNING",
                ))
            if threshold.min_per_day and actual < threshold.min_per_day:
                violations.append(RuleViolation(
                    condition_code="",
                    rule_type="REQUIRE",
                    reason=f"Daily {nutrient.replace('_', ' ')} {actual:.0f} below minimum {threshold.min_per_day:.0f}",
                    severity="WARNING",
                ))
        return violations

    def generate_explanation_tags(self, food: Food, constraints: UserConstraints) -> list[ExplanationTag]:
        """Generate the ✓ badge list shown in the UI per food item."""
        tags: list[ExplanationTag] = []

        for rule in constraints.raw_rules:
            tv = rule.target_value
            scope = rule.scope
            rule_type = rule.rule_type

            if rule_type not in ("RECOMMEND", "REQUIRE"):
                continue

            if scope == "FOOD_FLAG":
                flag = tv.get("flag", "")
                if getattr(food, flag, False):
                    label = flag.replace("is_", "").replace("_", " ").title()
                    tags.append(ExplanationTag(
                        icon="✓",
                        text=label,
                        relevance=rule.condition.code if rule.condition else "general",
                    ))

        # Standard nutritional tags
        if food.is_low_gi and food.glycemic_index is not None:
            if "T2D" in constraints.condition_codes or "PREDIABETES" in constraints.condition_codes:
                tags.append(ExplanationTag("✓", "Low GI", "T2D"))
        if food.is_high_fiber:
            tags.append(ExplanationTag("✓", "High Fiber", "general"))
        if food.is_low_sodium:
            if "HTN" in constraints.condition_codes or "HEART_DISEASE" in constraints.condition_codes:
                tags.append(ExplanationTag("✓", "Low Sodium", "HTN"))
        if food.is_low_oxalate:
            if "KIDNEY_STONES" in constraints.condition_codes:
                tags.append(ExplanationTag("✓", "Low Oxalate", "KIDNEY_STONES"))
        if food.potassium_mg and food.potassium_mg > 300:
            if "HTN" in constraints.condition_codes:
                tags.append(ExplanationTag("✓", "High Potassium", "HTN"))
        if food.is_low_phosphorus:
            if "CKD" in constraints.condition_codes:
                tags.append(ExplanationTag("✓", "Low Phosphorus", "CKD"))

        # Deduplicate by text
        seen: set[str] = set()
        unique: list[ExplanationTag] = []
        for t in tags:
            if t.text not in seen:
                seen.add(t.text)
                unique.append(t)
        return unique

    def _find_rule_reason(self, constraints: UserConstraints, scope: str, target: str) -> str | None:
        for rule in constraints.raw_rules:
            tv = rule.target_value
            if rule.scope == scope and tv.get("food_group") == target:
                return rule.reason
        return None
