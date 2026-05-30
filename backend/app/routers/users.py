import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserGoal, UserCondition, DietaryPreference, LifestyleFactors
from app.models.condition import MedicalCondition
from app.schemas.user import OnboardingRequest, OnboardingResponse, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/onboard", response_model=OnboardingResponse, status_code=201)
async def onboard_user(request: OnboardingRequest, db: AsyncSession = Depends(get_db)):
    """Create user and all sub-resources in a single transaction."""
    # Create user
    user = User(
        name=request.profile.name,
        email=request.profile.email,
        age=request.profile.age,
        gender=request.profile.gender,
        height_cm=request.profile.height_cm,
        weight_kg=request.profile.weight_kg,
        activity_level=request.activity.activity_level,
    )
    db.add(user)
    await db.flush()

    # Goals
    for goal_in in request.goals:
        goal = UserGoal(
            user_id=user.id,
            goal_type=goal_in.goal_type,
            is_primary=goal_in.is_primary,
            target_weight_kg=goal_in.target_weight_kg,
        )
        db.add(goal)

    # Conditions
    for cond_in in request.conditions:
        cond_result = await db.execute(
            select(MedicalCondition).where(MedicalCondition.code == cond_in.condition_code)
        )
        condition = cond_result.scalar_one_or_none()
        if condition:
            uc = UserCondition(
                user_id=user.id,
                condition_id=condition.id,
                severity=cond_in.severity,
                notes=cond_in.notes,
            )
            db.add(uc)

    # Dietary preferences
    pref = DietaryPreference(
        user_id=user.id,
        diet_type=request.dietary_preferences.diet_type,
        allergies=request.dietary_preferences.allergies or [],
        intolerances=request.dietary_preferences.intolerances or [],
    )
    db.add(pref)

    # Lifestyle factors
    lf = LifestyleFactors(
        user_id=user.id,
        sleep_hours=request.lifestyle.sleep_hours,
        stress_level=request.lifestyle.stress_level,
        smoking_status=request.lifestyle.smoking_status,
        alcohol_units_week=request.lifestyle.alcohol_units_week,
        water_liters_day=request.lifestyle.water_liters_day,
    )
    db.add(lf)

    await db.commit()
    return OnboardingResponse(user_id=user.id, message="Profile created successfully")


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/summary")
async def get_user_summary(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.goals),
            selectinload(User.conditions).selectinload(UserCondition.condition),
            selectinload(User.dietary_preferences),
            selectinload(User.lifestyle_factors),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    condition_codes = [uc.condition.code for uc in user.conditions if uc.condition]
    primary_goal = next((g.goal_type for g in user.goals if g.is_primary), None)

    return {
        "user_id": str(user.id),
        "name": user.name,
        "age": user.age,
        "gender": user.gender,
        "weight_kg": user.weight_kg,
        "height_cm": user.height_cm,
        "activity_level": user.activity_level,
        "primary_goal": primary_goal,
        "condition_codes": condition_codes,
        "diet_type": user.dietary_preferences[0].diet_type if user.dietary_preferences else None,
        "lifestyle": {
            "sleep_hours": user.lifestyle_factors.sleep_hours if user.lifestyle_factors else None,
            "stress_level": user.lifestyle_factors.stress_level if user.lifestyle_factors else None,
            "water_liters_day": user.lifestyle_factors.water_liters_day if user.lifestyle_factors else None,
        } if user.lifestyle_factors else None,
    }
