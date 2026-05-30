import uuid
from datetime import date

from pydantic import BaseModel


class MacroTargets(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    protein_g_per_kg: float


class FoodOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    name_local: str | None
    food_group: str | None
    serving_size_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float | None
    sodium_mg: float | None
    potassium_mg: float | None
    glycemic_index: int | None
    is_low_gi: bool
    is_high_fiber: bool
    is_vegetarian: bool
    is_vegan: bool
    meal_tags: list[str] | None
    cuisine_type: str | None


class MealItemOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    food: FoodOut
    meal_slot: str
    quantity_g: float
    reason_tags: list[str] | None
    ai_reason: str | None

    # Computed fields
    calories: float = 0.0
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0


class MealSlotOut(BaseModel):
    slot: str
    items: list[MealItemOut]
    slot_calories: float
    slot_protein_g: float


class DietPlanOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    plan_date: date
    total_calories: float | None
    total_protein_g: float | None
    total_carbs_g: float | None
    total_fat_g: float | None
    total_fiber_g: float | None
    ai_summary: str | None
    meals: list[MealSlotOut] = []
    macro_targets: MacroTargets | None = None


class FoodSafetyCheck(BaseModel):
    food_id: uuid.UUID


class FoodSafetyResult(BaseModel):
    food_id: uuid.UUID
    food_name: str
    is_safe: bool
    score: float
    violations: list[dict]
    positive_tags: list[str]
    recommendation: str
