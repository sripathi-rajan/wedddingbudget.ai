"""Reinforcement Learning Budget Accuracy Agent.

Multi-Armed Bandit with epsilon-greedy strategy.

State  : category multipliers dict (one per budget category)
Action : adjust multiplier up/down based on actual vs estimated
Reward : accuracy improvement — how close estimate was to actual
"""
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

BUDGET_CATEGORIES = [
    "Wedding Type Base",
    "Events & Ceremonies",
    "Venue",
    "Accommodation",
    "Food & Beverages",
    "Decor & Design",
    "Artists & Entertainment",
    "Logistics & Transport",
    "Sundries & Basics",
    "Contingency Buffer (8%)",
]

ALPHA   = 0.1    # learning rate
EPSILON = 0.15   # exploration rate
_MULTIPLIER_MIN = 0.5
_MULTIPLIER_MAX = 2.0
_HISTORY_WINDOW = 50
_MIN_SAMPLES_FOR_ACCURACY = 3


class BudgetRLAgent:
    """Multi-Armed Bandit RL agent for wedding budget accuracy."""

    def __init__(self):
        self.multipliers:       Dict[str, float]      = {cat: 1.0  for cat in BUDGET_CATEGORIES}
        self.training_counts:   Dict[str, int]        = {cat: 0    for cat in BUDGET_CATEGORIES}
        self.accuracy_history:  Dict[str, List[float]] = {cat: []  for cat in BUDGET_CATEGORIES}
        self.alpha   = ALPHA
        self.epsilon = EPSILON

    # ── State persistence ────────────────────────────────────────────────────

    async def load_state(self, db):
        """Load multipliers from rl_agent_state and counts from rl_training_log."""
        from ml.rl_storage import load_rl_state, load_training_counts
        try:
            stored_mults = await load_rl_state(db)
            for cat, mult in stored_mults.items():
                if cat in self.multipliers:
                    self.multipliers[cat] = mult

            counts = await load_training_counts(db)
            for cat, count in counts.items():
                if cat in self.training_counts:
                    self.training_counts[cat] = count

            total = sum(self.training_counts.values())
            cats_trained = sum(1 for c in self.training_counts.values() if c > 0)
            logger.info(f"RL Agent loaded ({total} training samples across {cats_trained} categories)")
        except Exception as exc:
            logger.warning(f"RL load_state failed (using defaults): {exc}")

    async def save_state(self, db):
        """Upsert all multipliers to rl_agent_state table."""
        from ml.rl_storage import save_rl_state
        try:
            await save_rl_state(db, self.multipliers)
        except Exception as exc:
            logger.warning(f"RL save_state failed: {exc}")

    # ── Core RL ──────────────────────────────────────────────────────────────

    def predict(self, base_estimate: float, category: str) -> float:
        """Return RL-adjusted estimate. No exploration — always exploit."""
        multiplier = self.multipliers.get(category, 1.0)
        return base_estimate * multiplier

    async def update(self, category: str, estimated: float, actual: float, db) -> dict:
        """Update multiplier from observed actual vs estimated cost.

        Formula:
            ratio          = actual / estimated
            new_multiplier = (1 - alpha) * old_multiplier + alpha * ratio

        Returns dict with {new_multiplier, accuracy_delta, total_samples}.
        """
        if estimated <= 0 or actual <= 0:
            return {"error": "estimated and actual must be > 0"}

        old_multiplier = self.multipliers.get(category, 1.0)
        ratio          = actual / estimated
        new_multiplier = (1 - self.alpha) * old_multiplier + self.alpha * ratio
        new_multiplier = max(_MULTIPLIER_MIN, min(_MULTIPLIER_MAX, new_multiplier))

        # Accuracy delta: improvement in how close RL-adjusted estimate is to actual
        rl_before = estimated * old_multiplier
        rl_after  = estimated * new_multiplier
        acc_before = max(0.0, 1.0 - abs(rl_before - actual) / actual)
        acc_after  = max(0.0, 1.0 - abs(rl_after  - actual) / actual)
        accuracy_delta = acc_after - acc_before

        # Update in-memory state
        self.multipliers[category] = new_multiplier
        self.training_counts[category] = self.training_counts.get(category, 0) + 1
        hist = self.accuracy_history.setdefault(category, [])
        hist.append(acc_after)
        if len(hist) > _HISTORY_WINDOW:
            hist.pop(0)

        total_samples = sum(self.training_counts.values())

        # Persist
        from ml.rl_storage import log_update
        try:
            await log_update(
                db=db,
                category=category,
                estimated=estimated,
                actual=actual,
                old_multiplier=old_multiplier,
                new_multiplier=new_multiplier,
                accuracy_delta=accuracy_delta,
            )
            await self.save_state(db)
        except Exception as exc:
            logger.warning(f"RL persist failed: {exc}")

        return {
            "new_multiplier":  round(new_multiplier, 4),
            "accuracy_delta":  round(accuracy_delta * 100, 2),
            "total_samples":   total_samples,
        }

    # ── Stats ────────────────────────────────────────────────────────────────

    def get_accuracy_for_category(self, category: str) -> Optional[float]:
        """Return avg accuracy of last 10 samples, or None if < 3 samples."""
        hist = self.accuracy_history.get(category, [])
        if len(hist) < _MIN_SAMPLES_FOR_ACCURACY:
            return None
        recent = hist[-10:]
        return round(sum(recent) / len(recent) * 100, 1)

    def get_stats(self) -> dict:
        """Return per-category and overall RL stats."""
        per_category = {}
        all_accuracies = []
        for cat in BUDGET_CATEGORIES:
            count  = self.training_counts.get(cat, 0)
            mult   = self.multipliers.get(cat, 1.0)
            acc    = self.get_accuracy_for_category(cat)
            hist   = self.accuracy_history.get(cat, [])

            # Trend: compare last 5 vs prev 5
            trend = "stable"
            if len(hist) >= 6:
                prev = sum(hist[-10:-5]) / max(1, len(hist[-10:-5]))
                curr = sum(hist[-5:])    / 5
                if curr > prev + 0.01:
                    trend = "improving"
                elif curr < prev - 0.01:
                    trend = "degrading"

            per_category[cat] = {
                "multiplier":     round(mult, 4),
                "training_count": count,
                "avg_accuracy":   acc,
                "trend":          trend,
                "rl_adjusted":    abs(mult - 1.0) > 0.05,
            }
            if acc is not None:
                all_accuracies.append(acc)

        total_samples   = sum(self.training_counts.values())
        overall_acc     = round(sum(all_accuracies) / len(all_accuracies), 1) if all_accuracies else None

        # Most improved / least accurate
        cats_with_data = [(c, per_category[c]) for c in BUDGET_CATEGORIES if per_category[c]["avg_accuracy"] is not None]
        most_improved    = max(cats_with_data, key=lambda x: x[1]["avg_accuracy"], default=(None, {}))[0]
        least_accurate   = min(cats_with_data, key=lambda x: x[1]["avg_accuracy"], default=(None, {}))[0]

        return {
            "per_category":             per_category,
            "total_training_samples":   total_samples,
            "overall_accuracy":         overall_acc,
            "most_improved_category":   most_improved,
            "least_accurate_category":  least_accurate,
            "rl_active":                total_samples > 0,
        }


# ── Singleton ────────────────────────────────────────────────────────────────
_agent: Optional[BudgetRLAgent] = None


def get_rl_agent() -> BudgetRLAgent:
    global _agent
    if _agent is None:
        _agent = BudgetRLAgent()
    return _agent
