import uuid
from datetime import date

from pydantic import BaseModel


class ExerciseItem(BaseModel):
    exercise: str
    sets: int | None = None
    reps: int | None = None
    duration_sec: int | None = None
    rest_sec: int | None = None


class WorkoutTemplateOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    fitness_level: str | None
    goal_type: str | None
    duration_min: int | None
    equipment: list[str] | None
    description: str | None
    instructions: dict | None


class DayWorkout(BaseModel):
    day: str
    templates: list[WorkoutTemplateOut]
    is_rest_day: bool = False


class WorkoutPlanOut(BaseModel):
    week_start: date
    days: list[DayWorkout]
    fitness_level: str
    ai_summary: str | None = None


class WorkoutLogIn(BaseModel):
    template_id: uuid.UUID
    completed: bool = True
    duration_min: int | None = None
    notes: str | None = None
