import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserProfileIn(BaseModel):
    name: str | None = None
    email: str | None = None
    age: int = Field(..., ge=10, le=120)
    gender: Literal["male", "female", "other"]
    height_cm: float = Field(..., ge=50, le=300)
    weight_kg: float = Field(..., ge=20, le=500)


class ActivityProfileIn(BaseModel):
    activity_level: Literal["sedentary", "light", "moderate", "active", "very_active"]
    daily_steps: int | None = None
    exercise_frequency_per_week: int | None = None


class GoalIn(BaseModel):
    goal_type: Literal[
        "weight_loss", "fat_loss", "muscle_gain", "maintenance",
        "healthy_aging", "cardiovascular", "diabetes_friendly", "blood_pressure_management"
    ]
    is_primary: bool = True
    target_weight_kg: float | None = None


class ConditionIn(BaseModel):
    condition_code: str
    severity: Literal["mild", "moderate", "severe"] | None = None
    notes: str | None = None


class DietaryPreferenceIn(BaseModel):
    diet_type: Literal[
        "vegetarian", "vegan", "non_veg", "mediterranean",
        "indian", "low_carb", "high_protein"
    ] | None = None
    allergies: list[str] = []
    intolerances: list[str] = []


class LifestyleIn(BaseModel):
    sleep_hours: float | None = Field(None, ge=0, le=24)
    stress_level: Literal["low", "medium", "high"] | None = None
    smoking_status: Literal["never", "former", "current"] | None = None
    alcohol_units_week: int | None = Field(None, ge=0)
    water_liters_day: float | None = Field(None, ge=0)


class OnboardingRequest(BaseModel):
    profile: UserProfileIn
    activity: ActivityProfileIn
    goals: list[GoalIn]
    conditions: list[ConditionIn] = []
    dietary_preferences: DietaryPreferenceIn = DietaryPreferenceIn()
    lifestyle: LifestyleIn = LifestyleIn()


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str | None
    email: str | None
    age: int | None
    gender: str | None
    height_cm: float | None
    weight_kg: float | None
    activity_level: str | None
    created_at: datetime


class OnboardingResponse(BaseModel):
    user_id: uuid.UUID
    message: str
