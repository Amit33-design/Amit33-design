import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.progress import ProgressLog
from app.models.user import User
from app.schemas.progress import ProgressLogIn, ProgressLogOut

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("/{user_id}/log", response_model=ProgressLogOut, status_code=201)
async def log_progress(
    user_id: uuid.UUID,
    body: ProgressLogIn,
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log = ProgressLog(
        user_id=user_id,
        log_date=body.log_date or date.today(),
        weight_kg=body.weight_kg,
        calories_consumed=body.calories_consumed,
        calories_burned=body.calories_burned,
        steps_count=body.steps_count,
        sleep_hours=body.sleep_hours,
        water_liters=body.water_liters,
        mood_score=body.mood_score,
        notes=body.notes,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/{user_id}/history")
async def get_progress_history(
    user_id: uuid.UUID,
    days: int = Query(default=30, le=365),
    db: AsyncSession = Depends(get_db),
):
    since = date.today() - timedelta(days=days)
    result = await db.execute(
        select(ProgressLog)
        .where(ProgressLog.user_id == user_id, ProgressLog.log_date >= since)
        .order_by(desc(ProgressLog.log_date))
    )
    logs = result.scalars().all()
    return {
        "logs": [
            {
                "id": str(log.id),
                "log_date": log.log_date.isoformat(),
                "weight_kg": log.weight_kg,
                "calories_consumed": log.calories_consumed,
                "calories_burned": log.calories_burned,
                "steps_count": log.steps_count,
                "sleep_hours": log.sleep_hours,
                "water_liters": log.water_liters,
                "mood_score": log.mood_score,
                "notes": log.notes,
            }
            for log in logs
        ]
    }


@router.get("/{user_id}/trends")
async def get_trends(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    since = date.today() - timedelta(days=30)
    result = await db.execute(
        select(ProgressLog)
        .where(ProgressLog.user_id == user_id, ProgressLog.log_date >= since)
        .order_by(ProgressLog.log_date)
    )
    logs = result.scalars().all()

    def extract_trend(values: list[float | None]) -> str:
        vals = [v for v in values if v is not None]
        if len(vals) < 2:
            return "insufficient_data"
        delta = vals[-1] - vals[0]
        return "improving" if delta < 0 else ("stable" if abs(delta) < 0.5 else "declining")

    weight_vals = [log.weight_kg for log in logs]
    sleep_vals = [log.sleep_hours for log in logs]

    return {
        "weight": {
            "values": [{"date": log.log_date.isoformat(), "value": log.weight_kg} for log in logs if log.weight_kg],
            "trend": extract_trend(weight_vals),
        },
        "sleep": {
            "values": [{"date": log.log_date.isoformat(), "value": log.sleep_hours} for log in logs if log.sleep_hours],
            "trend": extract_trend([-v for v in sleep_vals if v]),
        },
        "steps": {
            "values": [{"date": log.log_date.isoformat(), "value": log.steps_count} for log in logs if log.steps_count],
        },
    }
