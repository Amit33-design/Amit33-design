import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class DietPlan(Base):
    __tablename__ = "diet_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    plan_date: Mapped[date] = mapped_column(Date, nullable=False)
    plan_type: Mapped[str] = mapped_column(String(20), default="daily")
    total_calories: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_protein_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_carbs_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_fat_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_fiber_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="diet_plans")
    meal_items: Mapped[list["MealItem"]] = relationship("MealItem", back_populates="diet_plan", cascade="all, delete-orphan")


class MealItem(Base):
    __tablename__ = "meal_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    diet_plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("diet_plans.id", ondelete="CASCADE"))
    food_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("foods.id"))
    meal_slot: Mapped[str] = mapped_column(String(20))  # breakfast|mid_morning|lunch|evening_snack|dinner
    quantity_g: Mapped[float] = mapped_column(Float, nullable=False)
    reason_tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    ai_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    diet_plan: Mapped["DietPlan"] = relationship("DietPlan", back_populates="meal_items")
    food: Mapped["Food"] = relationship("Food")
