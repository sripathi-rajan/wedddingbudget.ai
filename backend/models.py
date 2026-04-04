"""SQLAlchemy ORM models for WeddingBudget.AI."""
from datetime import datetime
from sqlalchemy import (
    Integer, String, Float, Boolean, Text, DateTime, func
)
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Artist(Base):
    __tablename__ = "artists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    min_fee: Mapped[int] = mapped_column(Integer, nullable=False)
    max_fee: Mapped[int] = mapped_column(Integer, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class FBRate(Base):
    __tablename__ = "fb_rates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meal_type: Mapped[str] = mapped_column(String(50), nullable=False)   # veg / non_veg / jain
    tier: Mapped[str] = mapped_column(String(50), nullable=False)         # basic / standard / premium
    per_head_cost: Mapped[float] = mapped_column(Float, nullable=False)
    # meal_type+tier together represent a cost by meal occasion stored as JSON-ish flat rows
    # We store one row per (meal_type, tier, occasion) trio
    occasion: Mapped[str] = mapped_column(String(50), nullable=False)    # breakfast/lunch/dinner/snacks
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class LogisticsCost(Base):
    __tablename__ = "logistics_costs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)   # ghodi / dholi / transfer_per_trip
    unit_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=True, default="per_event")
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class DecorImage(Base):
    __tablename__ = "decor_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(300), nullable=False, unique=True)
    url: Mapped[str] = mapped_column(Text, nullable=True)
    function_type: Mapped[str] = mapped_column(String(100), nullable=True)
    style: Mapped[str] = mapped_column(String(100), nullable=True)
    complexity: Mapped[int] = mapped_column(Integer, nullable=True)   # 1–5
    seed_cost: Mapped[float] = mapped_column(Float, nullable=True)
    is_labelled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class BudgetTracker(Base):
    __tablename__ = "budget_tracker"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(200), nullable=False)
    estimated: Mapped[float] = mapped_column(Float, nullable=True)
    actual: Mapped[float] = mapped_column(Float, nullable=True)
    difference: Mapped[float] = mapped_column(Float, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class AdminSetting(Base):
    __tablename__ = "admin_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by: Mapped[str] = mapped_column(String(200), nullable=True)


class CostVersion(Base):
    __tablename__ = "cost_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    record_id: Mapped[int] = mapped_column(Integer, nullable=False)
    old_value: Mapped[str] = mapped_column(Text, nullable=True)
    new_value: Mapped[str] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
