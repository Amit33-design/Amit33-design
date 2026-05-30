import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(10), nullable=True)  # male|female|other
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    activity_level: Mapped[str | None] = mapped_column(String(20), nullable=True)  # sedentary|light|moderate|active|very_active
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    goals: Mapped[list["UserGoal"]] = relationship("UserGoal", back_populates="user", cascade="all, delete-orphan")
    conditions: Mapped[list["UserCondition"]] = relationship("UserCondition", back_populates="user", cascade="all, delete-orphan")
    dietary_preferences: Mapped[list["DietaryPreference"]] = relationship("DietaryPreference", back_populates="user", cascade="all, delete-orphan")
    lifestyle_factors: Mapped["LifestyleFactors | None"] = relationship("LifestyleFactors", back_populates="user", uselist=False, cascade="all, delete-orphan")
    diet_plans: Mapped[list["DietPlan"]] = relationship("DietPlan", back_populates="user", cascade="all, delete-orphan")
    workout_plans: Mapped[list["WorkoutPlan"]] = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    progress_logs: Mapped[list["ProgressLog"]] = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")
    chat_sessions: Mapped[list["AIChatSession"]] = relationship("AIChatSession", back_populates="user", cascade="all, delete-orphan")


class UserGoal(Base):
    __tablename__ = "user_goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    goal_type: Mapped[str] = mapped_column(String(50))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    target_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="goals")


class UserCondition(Base):
    __tablename__ = "user_conditions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    condition_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("medical_conditions.id"))
    severity: Mapped[str | None] = mapped_column(String(10), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="conditions")
    condition: Mapped["MedicalCondition"] = relationship("MedicalCondition")


class DietaryPreference(Base):
    __tablename__ = "dietary_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    diet_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    allergies: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    intolerances: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="dietary_preferences")


class LifestyleFactors(Base):
    __tablename__ = "lifestyle_factors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    stress_level: Mapped[str | None] = mapped_column(String(10), nullable=True)  # low|medium|high
    smoking_status: Mapped[str | None] = mapped_column(String(20), nullable=True)  # never|former|current
    alcohol_units_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    water_liters_day: Mapped[float | None] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="lifestyle_factors")
