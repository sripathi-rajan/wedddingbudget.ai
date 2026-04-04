"""Standalone DB helper functions for the RL budget agent.

Tables used:
  rl_agent_state   — persisted multipliers (one row per category)
  rl_training_log  — append-only log of every update
"""
from datetime import datetime, timezone
from typing import Dict

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession


# ── Load ─────────────────────────────────────────────────────────────────────

async def load_rl_state(db: AsyncSession) -> Dict[str, float]:
    """Return {category: multiplier} from rl_agent_state table."""
    from models import RLAgentState
    result = await db.execute(select(RLAgentState))
    rows   = result.scalars().all()
    return {row.category: row.multiplier for row in rows}


async def load_training_counts(db: AsyncSession) -> Dict[str, int]:
    """Return {category: count} from rl_training_log."""
    from models import RLTrainingLog
    result = await db.execute(
        select(RLTrainingLog.category, func.count(RLTrainingLog.id).label("cnt"))
        .group_by(RLTrainingLog.category)
    )
    return {row.category: row.cnt for row in result.all()}


# ── Save ─────────────────────────────────────────────────────────────────────

async def save_rl_state(db: AsyncSession, multipliers: Dict[str, float]) -> None:
    """Upsert all multipliers into rl_agent_state."""
    from models import RLAgentState
    for category, multiplier in multipliers.items():
        result = await db.execute(
            select(RLAgentState).where(RLAgentState.category == category)
        )
        row = result.scalar_one_or_none()
        if row is None:
            db.add(RLAgentState(category=category, multiplier=multiplier))
        else:
            row.multiplier  = multiplier
            row.updated_at  = datetime.now(timezone.utc)
    await db.commit()


# ── Log ──────────────────────────────────────────────────────────────────────

async def log_update(
    db: AsyncSession,
    category:      str,
    estimated:     float,
    actual:        float,
    old_multiplier: float,
    new_multiplier: float,
    accuracy_delta: float,
) -> None:
    """Append a training log row to rl_training_log."""
    from models import RLTrainingLog
    ratio = actual / estimated if estimated > 0 else 0.0
    db.add(RLTrainingLog(
        category       = category,
        estimated      = estimated,
        actual         = actual,
        ratio          = ratio,
        old_multiplier = old_multiplier,
        new_multiplier = new_multiplier,
        accuracy_delta = accuracy_delta,
        timestamp      = datetime.now(timezone.utc),
    ))
    await db.commit()


# ── Accuracy stats ────────────────────────────────────────────────────────────

async def get_accuracy_stats(db: AsyncSession) -> dict:
    """Return aggregate accuracy stats from rl_training_log."""
    from models import RLTrainingLog
    result = await db.execute(
        select(
            RLTrainingLog.category,
            func.count(RLTrainingLog.id).label("samples"),
            func.avg(RLTrainingLog.accuracy_delta).label("avg_delta"),
        ).group_by(RLTrainingLog.category)
    )
    rows = result.all()

    categories = {}
    for row in rows:
        categories[row.category] = {
            "samples":   row.samples,
            "avg_delta": round(float(row.avg_delta or 0), 4),
        }

    total_samples = sum(v["samples"] for v in categories.values())
    return {
        "categories":     categories,
        "total_samples":  total_samples,
    }
