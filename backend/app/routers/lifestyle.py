import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserCondition, LifestyleFactors
from app.engines.lifestyle_engine import generate_lifestyle_recommendations

router = APIRouter(prefix="/lifestyle", tags=["lifestyle"])


@router.get("/{user_id}/recommendations")
async def get_lifestyle_recommendations(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Load conditions
    cond_result = await db.execute(
        select(UserCondition).join(UserCondition.condition).where(UserCondition.user_id == user_id)
    )
    user_conditions = cond_result.scalars().all()
    condition_codes = [getattr(uc.condition, "code", "") for uc in user_conditions]

    # Load lifestyle factors
    lf_result = await db.execute(
        select(LifestyleFactors).where(LifestyleFactors.user_id == user_id)
    )
    lifestyle = lf_result.scalar_one_or_none()

    recommendations = generate_lifestyle_recommendations(user, lifestyle, condition_codes)
    return recommendations


@router.put("/{user_id}/factors")
async def update_lifestyle_factors(
    user_id: uuid.UUID,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    from app.schemas.user import LifestyleIn
    lifestyle_in = LifestyleIn(**body)

    lf_result = await db.execute(
        select(LifestyleFactors).where(LifestyleFactors.user_id == user_id)
    )
    lf = lf_result.scalar_one_or_none()
    if not lf:
        raise HTTPException(status_code=404, detail="Lifestyle factors not found. Complete onboarding first.")

    for field, val in lifestyle_in.model_dump(exclude_none=True).items():
        setattr(lf, field, val)

    await db.commit()
    return {"message": "Lifestyle factors updated"}
