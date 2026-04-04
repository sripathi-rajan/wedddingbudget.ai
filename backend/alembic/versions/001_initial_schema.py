"""Initial schema — all tables

Revision ID: 001
Revises:
Create Date: 2026-04-04
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "artists",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column("min_fee", sa.Integer(), nullable=False),
        sa.Column("max_fee", sa.Integer(), nullable=False),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "fb_rates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("meal_type", sa.String(50), nullable=False),
        sa.Column("tier", sa.String(50), nullable=False),
        sa.Column("occasion", sa.String(50), nullable=False),
        sa.Column("per_head_cost", sa.Float(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "logistics_costs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("service_type", sa.String(100), nullable=False),
        sa.Column("unit_cost", sa.Integer(), nullable=False),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "decor_images",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("filename", sa.String(300), nullable=False, unique=True),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("function_type", sa.String(100), nullable=True),
        sa.Column("style", sa.String(100), nullable=True),
        sa.Column("complexity", sa.Integer(), nullable=True),
        sa.Column("seed_cost", sa.Float(), nullable=True),
        sa.Column("is_labelled", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "budget_tracker",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("session_id", sa.String(200), nullable=False),
        sa.Column("category", sa.String(200), nullable=False),
        sa.Column("estimated", sa.Float(), nullable=True),
        sa.Column("actual", sa.Float(), nullable=True),
        sa.Column("difference", sa.Float(), nullable=True),
        sa.Column("logged_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "admin_settings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("key", sa.String(200), nullable=False, unique=True),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_by", sa.String(200), nullable=True),
    )
    op.create_table(
        "cost_versions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("table_name", sa.String(100), nullable=False),
        sa.Column("record_id", sa.Integer(), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("changed_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("cost_versions")
    op.drop_table("admin_settings")
    op.drop_table("budget_tracker")
    op.drop_table("decor_images")
    op.drop_table("logistics_costs")
    op.drop_table("fb_rates")
    op.drop_table("artists")
