import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserCondition
from app.models.workout import WorkoutTemplate
from app.engines.exercise_engine import ExerciseEngine, determine_fitness_level

router = APIRouter(prefix="/workouts", tags=["workouts"])
_exercise_engine = ExerciseEngine()


async def _get_user_or_404(user_id: uuid.UUID, db: AsyncSession) -> User:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/plan")
async def get_workout_plan(
    user_id: uuid.UUID,
    week: date = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user_or_404(user_id, db)
    target_date = week or date.today()
    week_start = target_date - timedelta(days=target_date.weekday())

    plan = await _exercise_engine.get_or_generate_plan(user, week_start, db)

    # Load condition codes for fitness level
    cond_result = await db.execute(
        select(UserCondition).join(UserCondition.condition).where(UserCondition.user_id == user_id)
    )
    user_conditions = cond_result.scalars().all()
    condition_codes = [getattr(uc.condition, "code", "") for uc in user_conditions]
    fitness_level = determine_fitness_level(user, condition_codes)

    schedule = plan.schedule or {}
    days = []
    for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
        day_val = schedule.get(day, "rest")
        if day_val == "rest":
            days.append({"day": day, "is_rest_day": True, "templates": []})
        else:
            template_ids = day_val if isinstance(day_val, list) else []
            templates_out = []
            for tid in template_ids:
                t_result = await db.execute(
                    select(WorkoutTemplate).where(WorkoutTemplate.id == tid)
                )
                t = t_result.scalar_one_or_none()
                if t:
                    templates_out.append({
                        "id": str(t.id),
                        "name": t.name,
                        "fitness_level": t.fitness_level,
                        "goal_type": t.goal_type,
                        "duration_min": t.duration_min,
                        "equipment": t.equipment,
                        "description": t.description,
                        "instructions": t.instructions,
                    })
            days.append({"day": day, "is_rest_day": False, "templates": templates_out})

    return {
        "week_start": week_start.isoformat(),
        "fitness_level": fitness_level,
        "days": days,
        "ai_summary": plan.ai_summary,
    }


@router.get("/{user_id}/today")
async def get_today_workout(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await _get_user_or_404(user_id, db)
    templates = await _exercise_engine.get_today_workout(user, db)
    day_name = date.today().strftime("%A")

    if not templates:
        return {"day": day_name, "is_rest_day": True, "templates": [], "message": "Rest day — recovery is part of training!"}

    templates_out = [{
        "id": str(t.id),
        "name": t.name,
        "fitness_level": t.fitness_level,
        "goal_type": t.goal_type,
        "duration_min": t.duration_min,
        "equipment": t.equipment or [],
        "description": t.description,
        "instructions": t.instructions,
    } for t in templates]

    return {"day": day_name, "is_rest_day": False, "templates": templates_out}
