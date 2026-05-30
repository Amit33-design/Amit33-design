"""Exercise Engine — selects and schedules workout templates."""
from __future__ import annotations

from datetime import date, timedelta
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserCondition, UserGoal
from app.models.workout import WorkoutTemplate, WorkoutPlan

if TYPE_CHECKING:
    import uuid

DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

# Conditions that limit exercise intensity
HIGH_RISK_CONDITIONS = {"HEART_DISEASE", "CKD"}
MODERATE_RISK_CONDITIONS = {"HTN", "T2D", "HYPERLIPIDEMIA"}


def determine_fitness_level(user: User, condition_codes: list[str]) -> str:
    """Determine fitness level based on age, activity, and conditions."""
    age = user.age or 30
    activity = user.activity_level or "sedentary"

    if age >= 60:
        return "older_adult"

    if any(c in HIGH_RISK_CONDITIONS for c in condition_codes):
        return "beginner"

    level_map = {
        "sedentary": "beginner",
        "light": "beginner",
        "moderate": "intermediate",
        "active": "intermediate",
        "very_active": "advanced",
    }
    return level_map.get(activity, "beginner")


class ExerciseEngine:

    async def get_or_generate_plan(
        self, user: User, week_start: date, db: AsyncSession
    ) -> WorkoutPlan:
        """Return existing workout plan or generate new one."""
        result = await db.execute(
            select(WorkoutPlan).where(
                WorkoutPlan.user_id == user.id,
                WorkoutPlan.week_start == week_start,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing
        return await self.generate_plan(user, week_start, db)

    async def generate_plan(
        self, user: User, week_start: date, db: AsyncSession
    ) -> WorkoutPlan:
        # Load user conditions and goal
        cond_result = await db.execute(
            select(UserCondition).join(UserCondition.condition).where(
                UserCondition.user_id == user.id
            )
        )
        user_conditions = cond_result.scalars().all()
        condition_codes = [
            getattr(uc.condition, "code", "") for uc in user_conditions
        ]

        goal_result = await db.execute(
            select(UserGoal).where(UserGoal.user_id == user.id, UserGoal.is_primary == True)
        )
        goal = goal_result.scalar_one_or_none()
        goal_type = goal.goal_type if goal else "maintenance"

        fitness_level = determine_fitness_level(user, condition_codes)

        # Query safe templates (no contraindicated conditions)
        templates_result = await db.execute(
            select(WorkoutTemplate).where(
                WorkoutTemplate.fitness_level == fitness_level,
            )
        )
        all_templates = list(templates_result.scalars().all())

        # Filter out contraindicated
        safe_templates = [
            t for t in all_templates
            if not t.contraindications
            or not any(c in condition_codes for c in t.contraindications)
        ]

        # Prefer goal-matching templates
        goal_templates = [t for t in safe_templates if t.goal_type == goal_type]
        if not goal_templates:
            goal_templates = safe_templates  # fall back to all safe

        # Build weekly schedule
        schedule = self._build_schedule(fitness_level, goal_templates, condition_codes)

        plan = WorkoutPlan(
            user_id=user.id,
            week_start=week_start,
            schedule=schedule,
        )
        db.add(plan)
        await db.commit()
        await db.refresh(plan)
        return plan

    def _build_schedule(
        self,
        fitness_level: str,
        templates: list[WorkoutTemplate],
        condition_codes: list[str],
    ) -> dict:
        """Assign templates to days. Returns {day: [template_ids]}."""
        # Determine active days
        if fitness_level == "older_adult" or any(c in HIGH_RISK_CONDITIONS for c in condition_codes):
            active_days = ["monday", "wednesday", "friday"]
        elif fitness_level == "beginner":
            active_days = ["monday", "wednesday", "friday"]
        elif fitness_level == "intermediate":
            active_days = ["monday", "tuesday", "thursday", "friday"]
        else:  # advanced
            active_days = ["monday", "tuesday", "wednesday", "thursday", "friday"]

        schedule: dict[str, list | str] = {}
        for day in DAYS_OF_WEEK:
            if day in active_days and templates:
                # Rotate templates across active days
                idx = active_days.index(day) % len(templates)
                template = templates[idx]
                schedule[day] = [str(template.id)]
            else:
                schedule[day] = "rest"

        return schedule

    async def get_today_workout(self, user: User, db: AsyncSession) -> list[WorkoutTemplate]:
        """Get today's workout templates."""
        today = date.today()
        # Find the Monday of this week
        week_start = today - timedelta(days=today.weekday())

        plan = await self.get_or_generate_plan(user, week_start, db)
        if not plan.schedule:
            return []

        day_name = today.strftime("%A").lower()
        day_schedule = plan.schedule.get(day_name, "rest")

        if day_schedule == "rest" or not day_schedule:
            return []

        template_ids = day_schedule
        result = await db.execute(
            select(WorkoutTemplate).where(
                WorkoutTemplate.id.in_(template_ids)
            )
        )
        return list(result.scalars().all())
