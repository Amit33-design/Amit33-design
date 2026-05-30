import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class ProgressLogIn(BaseModel):
    log_date: date | None = None
    weight_kg: float | None = Field(None, ge=20, le=500)
    calories_consumed: float | None = Field(None, ge=0)
    calories_burned: float | None = Field(None, ge=0)
    steps_count: int | None = Field(None, ge=0)
    sleep_hours: float | None = Field(None, ge=0, le=24)
    water_liters: float | None = Field(None, ge=0)
    mood_score: int | None = Field(None, ge=1, le=5)
    notes: str | None = None


class ProgressLogOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    log_date: date
    weight_kg: float | None
    calories_consumed: float | None
    calories_burned: float | None
    steps_count: int | None
    sleep_hours: float | None
    water_liters: float | None
    mood_score: int | None
    notes: str | None
    created_at: datetime


class ProgressTrend(BaseModel):
    metric: str
    values: list[dict]  # [{date, value}]
    trend: str  # improving|declining|stable
    change_pct: float | None
