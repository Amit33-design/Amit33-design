import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class MedicalCondition(Base):
    __tablename__ = "medical_conditions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str | None] = mapped_column(String(10), nullable=True)

    rules: Mapped[list["ConditionFoodRule"]] = relationship("ConditionFoodRule", back_populates="condition")


class ConditionFoodRule(Base):
    __tablename__ = "condition_food_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    condition_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("medical_conditions.id"))
    rule_type: Mapped[str] = mapped_column(String(20), nullable=False)  # AVOID|LIMIT|RECOMMEND|REQUIRE
    scope: Mapped[str] = mapped_column(String(30), nullable=False)  # FOOD_GROUP|SPECIFIC_FOOD|NUTRIENT_THRESHOLD|FOOD_FLAG
    target_value: Mapped[dict] = mapped_column(JSONB, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_level: Mapped[str | None] = mapped_column(String(10), nullable=True)  # strong|moderate|emerging
    priority: Mapped[int] = mapped_column(Integer, default=5)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    condition: Mapped["MedicalCondition"] = relationship("MedicalCondition", back_populates="rules")
