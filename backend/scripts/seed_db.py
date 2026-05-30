"""Database seeding script. Run: python -m scripts.seed_db"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings
from app.database import Base
from app.models.condition import MedicalCondition, ConditionFoodRule
from app.models.food import Food
from app.models.workout import WorkoutTemplate
from app.data.condition_rules_seed import CONDITIONS, RULES
from app.data.foods_seed import FOODS
from app.data.workout_templates_seed import TEMPLATES


async def seed(db: AsyncSession):
    print("Seeding medical conditions...")
    condition_map = {}
    for cdata in CONDITIONS:
        existing = await db.get(MedicalCondition, None)
        cond = MedicalCondition(
            code=cdata["code"],
            name=cdata["name"],
            description=cdata.get("description"),
        )
        db.add(cond)
        await db.flush()
        condition_map[cdata["code"]] = cond.id
    print(f"  Added {len(CONDITIONS)} conditions")

    print("Seeding condition food rules...")
    rule_count = 0
    for rdata in RULES:
        code = rdata["condition_code"]
        if code not in condition_map:
            continue
        rule = ConditionFoodRule(
            condition_id=condition_map[code],
            rule_type=rdata["rule_type"],
            scope=rdata["scope"],
            target_value=rdata["target_value"],
            reason=rdata["reason"],
            evidence_level=rdata.get("evidence_level"),
            priority=rdata.get("priority", 5),
        )
        db.add(rule)
        rule_count += 1
    print(f"  Added {rule_count} rules")

    print("Seeding foods...")
    for fdata in FOODS:
        food = Food(**fdata)
        db.add(food)
    print(f"  Added {len(FOODS)} foods")

    print("Seeding workout templates...")
    for tdata in TEMPLATES:
        template = WorkoutTemplate(**tdata)
        db.add(template)
    print(f"  Added {len(TEMPLATES)} workout templates")

    await db.commit()
    print("Seeding complete!")


async def main():
    engine = create_async_engine(settings.database_url, echo=False)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created.")

    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with AsyncSessionLocal() as db:
        await seed(db)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
