"""Decor cost prediction model: ML (RandomForest) or rule-based fallback."""
import os
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "decor_model.pkl")
IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "decor_images")

# Rule-based cost ranges (INR) by complexity 1-5
RULE_RANGES = {
    1: (30_000,   80_000),
    2: (80_000,  200_000),
    3: (200_000, 500_000),
    4: (500_000, 1_000_000),
    5: (1_000_000, 2_500_000),
}


class DecorCostPredictor:
    def __init__(self):
        self.model_mid = None
        self.model_low = None
        self.model_high = None
        self.function_types: list = []
        self.styles: list = []
        self.n_samples: int = 0
        self._try_load()

    def _try_load(self):
        if os.path.exists(MODEL_PATH):
            try:
                import joblib
                data = joblib.load(MODEL_PATH)
                self.model_mid = data["model_mid"]
                self.model_low = data["model_low"]
                self.model_high = data["model_high"]
                self.function_types = data["function_types"]
                self.styles = data["styles"]
                self.n_samples = data["n_samples"]
            except Exception:
                pass

    async def train(self, db_session) -> dict:
        """Train on all labelled DecorImages; save model to disk.

        Returns a dict with keys: method, samples, accuracy.
        Falls back to rule-based if < 5 labelled images.
        """
        import joblib
        from sqlalchemy import select
        from models import DecorImage
        from ml.decor_features import extract_features
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.model_selection import train_test_split

        result = await db_session.execute(
            select(DecorImage).where(DecorImage.is_labelled == True)  # noqa: E712
        )
        images = result.scalars().all()

        if len(images) < 5:
            return {"method": "rule-based", "samples": len(images), "accuracy": None}

        function_types = sorted({img.function_type for img in images if img.function_type})
        styles = sorted({img.style for img in images if img.style})

        X_list, y_list = [], []
        for img in images:
            img_path = os.path.join(IMAGES_DIR, img.filename)
            feats = extract_features(img_path)
            ft_vec = [1.0 if img.function_type == ft else 0.0 for ft in function_types]
            st_vec = [1.0 if img.style == s else 0.0 for s in styles]
            comp = (img.complexity or 3) / 5.0
            X_list.append(np.concatenate([feats, ft_vec, st_vec, [comp]]))
            y_list.append(float(img.seed_cost or 0))

        X = np.array(X_list)
        y = np.array(y_list)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        model_mid = RandomForestRegressor(n_estimators=100, random_state=42)
        model_mid.fit(X_train, y_train)

        model_low = RandomForestRegressor(n_estimators=100, random_state=42)
        model_low.fit(X_train, y_train * 0.8)

        model_high = RandomForestRegressor(n_estimators=100, random_state=42)
        model_high.fit(X_train, y_train * 1.3)

        score = float(model_mid.score(X_test, y_test))

        self.model_mid = model_mid
        self.model_low = model_low
        self.model_high = model_high
        self.function_types = function_types
        self.styles = styles
        self.n_samples = len(images)

        joblib.dump(
            {
                "model_mid": model_mid,
                "model_low": model_low,
                "model_high": model_high,
                "function_types": function_types,
                "styles": styles,
                "n_samples": len(images),
            },
            MODEL_PATH,
        )

        return {"method": "ml", "samples": len(images), "accuracy": round(score, 3)}

    def _is_decor_image(self, image_path: str) -> tuple[bool, str]:
        """Return (is_valid, reason). Rejects non-decor images via heuristics."""
        try:
            from ml.decor_features import extract_features
            feats = extract_features(image_path)
            # feats indices: 9=brightness, 10=complexity_score, 11=color_variance, 12=warm_ratio
            brightness = feats[9]
            complexity_score = feats[10]
            color_variance = feats[11]
            warm_ratio = feats[12]

            # Likely a skin-tone / portrait: warm, bright, low complexity
            if warm_ratio > 0.55 and brightness > 0.55 and complexity_score < 0.18:
                return False, "skin-tone"
            if complexity_score < 0.05:
                return False, "plain"
            if color_variance < 0.03:
                return False, "low-variance"
        except Exception:
            pass
        return True, ""

    def predict(self, image_path: str, function_type=None, style=None, complexity=None) -> dict:
        """Return cost prediction dict.

        Uses ML model when trained, otherwise falls back to rule-based ranges.
        """
        valid, reason = self._is_decor_image(image_path)
        if not valid:
            return {
                "predicted_low": 0,
                "predicted_mid": 0,
                "predicted_high": 0,
                "confidence": 0,
                "method": "rejected",
                "message": "Please upload a decor/venue image",
            }

        if self.model_mid is not None:
            from ml.decor_features import extract_features

            feats = extract_features(image_path)
            ft_vec = [1.0 if function_type == ft else 0.0 for ft in self.function_types]
            st_vec = [1.0 if style == s else 0.0 for s in self.styles]
            comp = (int(complexity) if complexity is not None else 3) / 5.0
            x = np.concatenate([feats, ft_vec, st_vec, [comp]]).reshape(1, -1)

            mid = int(self.model_mid.predict(x)[0])
            low = int(self.model_low.predict(x)[0])
            high = int(self.model_high.predict(x)[0])
            confidence = round(min(0.95, 0.60 + self.n_samples / 200.0), 2)
            return {
                "predicted_low": low,
                "predicted_mid": mid,
                "predicted_high": high,
                "confidence": confidence,
                "method": "ml",
            }

        # Rule-based fallback
        c = int(complexity) if isinstance(complexity, (int, float)) else 3
        c = max(1, min(5, c))
        low, high = RULE_RANGES[c]
        mid = (low + high) // 2
        return {
            "predicted_low": low,
            "predicted_mid": mid,
            "predicted_high": high,
            "confidence": 0.50,
            "method": "rule-based",
        }


# ── Module-level singleton ─────────────────────────────────────────────────────
_predictor: DecorCostPredictor | None = None


def get_predictor() -> DecorCostPredictor:
    global _predictor
    if _predictor is None:
        _predictor = DecorCostPredictor()
    return _predictor
