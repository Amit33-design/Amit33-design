import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Food(Base):
    __tablename__ = "foods"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_local: Mapped[str | None] = mapped_column(String(255), nullable=True)
    food_group: Mapped[str | None] = mapped_column(String(50), nullable=True)
    serving_size_g: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)

    # Macros per serving
    calories: Mapped[float] = mapped_column(Float, nullable=False)
    protein_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    carbs_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fat_g: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fiber_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    sugar_g: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Clinically relevant micronutrients (per serving)
    sodium_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    potassium_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    phosphorus_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    oxalate_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    purine_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    cholesterol_mg: Mapped[float | None] = mapped_column(Float, nullable=True)
    saturated_fat_g: Mapped[float | None] = mapped_column(Float, nullable=True)
    glycemic_index: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Derived boolean flags (set at insert time from nutrient values)
    is_low_gi: Mapped[bool] = mapped_column(Boolean, default=False)        # GI < 55
    is_high_fiber: Mapped[bool] = mapped_column(Boolean, default=False)    # fiber >= 3g per serving
    is_low_sodium: Mapped[bool] = mapped_column(Boolean, default=True)     # sodium < 140mg per serving
    is_low_oxalate: Mapped[bool] = mapped_column(Boolean, default=True)    # oxalate < 10mg per serving
    is_low_phosphorus: Mapped[bool] = mapped_column(Boolean, default=True) # phosphorus < 100mg per serving

    # Diet compatibility
    is_vegetarian: Mapped[bool] = mapped_column(Boolean, default=True)
    is_vegan: Mapped[bool] = mapped_column(Boolean, default=False)
    is_gluten_free: Mapped[bool] = mapped_column(Boolean, default=False)

    # Meal slot tags
    meal_tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    cuisine_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # indian|western|mediterranean
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    source: Mapped[str | None] = mapped_column(String(50), nullable=True)  # USDA|IFCT|manual
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
