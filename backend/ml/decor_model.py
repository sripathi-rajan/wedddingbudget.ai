"""Decor cost prediction model: GradientBoosting + MobileNetV2/PCA embeddings + StandardScaler."""
import csv
import os
import warnings
import numpy as np

warnings.filterwarnings('ignore')

_mobilenet_classifier = None
_mobilenet_embedder   = None


def _get_mobilenet_classifier():
    """Full MobileNetV2 (with top) for decor/reject classification."""
    global _mobilenet_classifier
    if _mobilenet_classifier is None:
        from tensorflow.keras.applications import MobileNetV2
        _mobilenet_classifier = MobileNetV2(weights='imagenet')
    return _mobilenet_classifier


def _get_mobilenet_embedder():
    """MobileNetV2 without top, pooling='avg' — outputs 1280-dim embedding."""
    global _mobilenet_embedder
    if _mobilenet_embedder is None:
        from tensorflow.keras.applications import MobileNetV2
        _mobilenet_embedder = MobileNetV2(weights='imagenet', include_top=False,
                                          pooling='avg', input_shape=(224, 224, 3))
    return _mobilenet_embedder


MODEL_PATH = os.path.join(os.path.dirname(__file__), "decor_model.pkl")
PCA_PATH   = os.path.join(os.path.dirname(__file__), "decor_pca.pkl")
IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "decor_dataset", "data", "images")
LABELS_CSV = os.path.join(os.path.dirname(os.path.dirname(__file__)), "decor_dataset", "data", "labels.csv")

# Rule-based cost ranges (INR) by complexity 1-5
RULE_RANGES = {
    1: (30_000,   80_000),
    2: (80_000,  200_000),
    3: (200_000, 500_000),
    4: (500_000, 1_000_000),
    5: (1_000_000, 2_500_000),
}


def _read_labels() -> dict:
    """Return dict of {filename: {function_type, style, complexity, seed_cost}}."""
    labels = {}
    if not os.path.exists(LABELS_CSV):
        return labels
    with open(LABELS_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            labels[row["filename"]] = row
    return labels


def _extract_embedding(image_path: str) -> np.ndarray:
    """Extract 1280-dim MobileNetV2 global_average_pooling embedding."""
    try:
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        from PIL import Image
        img = Image.open(image_path).convert("RGB").resize((224, 224))
        arr = preprocess_input(np.array(img, dtype=np.float32)[np.newaxis])
        return _get_mobilenet_embedder().predict(arr, verbose=0)[0]
    except Exception:
        return np.zeros(1280, dtype=np.float32)


class DecorCostPredictor:
    def __init__(self):
        self.model_mid  = None
        self.model_low  = None
        self.model_high = None
        self.scaler: object = None
        self.pca: object    = None
        self.function_types: list = []
        self.styles: list = []
        self.n_samples: int = 0
        self.cv_score: float | None = None
        self._try_load()

    def _try_load(self):
        if os.path.exists(MODEL_PATH):
            try:
                import joblib
                data = joblib.load(MODEL_PATH)
                self.model_mid      = data["model_mid"]
                self.model_low      = data["model_low"]
                self.model_high     = data["model_high"]
                self.scaler         = data.get("scaler")
                self.function_types = data["function_types"]
                self.styles         = data["styles"]
                self.n_samples      = data["n_samples"]
                self.cv_score       = data.get("cv_score")
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning("Failed to load decor model, deleting pkl: %s", e)
                self.model_mid = None
                try:
                    os.remove(MODEL_PATH)
                except OSError:
                    pass

        if os.path.exists(PCA_PATH):
            try:
                import joblib
                self.pca = joblib.load(PCA_PATH)
            except Exception:
                self.pca = None

    async def train(self, db_session=None) -> dict:
        """Train GradientBoostingRegressor on MobileNetV2/PCA + pixel features.

        Returns a dict with keys: method, samples, accuracy, cv_score.
        Falls back to rule-based if < 5 labelled images.
        """
        import joblib
        from ml.decor_features import extract_features
        from sklearn.decomposition import PCA
        from sklearn.ensemble import GradientBoostingRegressor
        from sklearn.model_selection import train_test_split, cross_val_score
        from sklearn.preprocessing import StandardScaler

        labels = _read_labels()

        if len(labels) < 5:
            return {"method": "rule-based", "samples": len(labels), "accuracy": None, "cv_score": None}

        function_types = sorted({row["function_type"] for row in labels.values() if row.get("function_type")})
        styles         = sorted({row["style"]         for row in labels.values() if row.get("style")})

        # Collect pixel features, embeddings, targets
        pixel_list, embed_list, y_list, meta_list = [], [], [], []
        for filename, row in labels.items():
            img_path = os.path.join(IMAGES_DIR, filename)
            if not os.path.exists(img_path):
                continue
            pixel_feats = extract_features(img_path)  # 19-dim
            embedding   = _extract_embedding(img_path)  # 1280-dim
            ft_vec = [1.0 if row.get("function_type") == ft else 0.0 for ft in function_types]
            st_vec = [1.0 if row.get("style") == s else 0.0 for s in styles]
            comp   = (int(row.get("complexity") or 3)) / 5.0
            pixel_list.append(pixel_feats)
            embed_list.append(embedding)
            y_list.append(float(row.get("seed_cost") or 0))
            meta_list.append(np.array(ft_vec + st_vec + [comp]))

        if len(pixel_list) < 5:
            return {"method": "rule-based", "samples": len(pixel_list), "accuracy": None, "cv_score": None}

        embed_arr = np.array(embed_list, dtype=np.float32)

        # Fit PCA(50) on embeddings
        n_components = min(50, embed_arr.shape[0] - 1, embed_arr.shape[1])
        pca = PCA(n_components=n_components, random_state=42)
        embed_reduced = pca.fit_transform(embed_arr)  # (N, 50)

        # Concatenate: pixel(19) + pca(50) + meta(ft+style+comp)
        X_list = [
            np.concatenate([pf, er, m])
            for pf, er, m in zip(pixel_list, embed_reduced, meta_list)
        ]
        X = np.array(X_list)
        y = np.array(y_list)

        # Normalise features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

        gb_params = dict(n_estimators=200, learning_rate=0.05, max_depth=4,
                         subsample=0.8, random_state=42)

        model_mid  = GradientBoostingRegressor(**gb_params)
        model_mid.fit(X_train, y_train)

        model_low  = GradientBoostingRegressor(**gb_params)
        model_low.fit(X_train, y_train * 0.8)

        model_high = GradientBoostingRegressor(**gb_params)
        model_high.fit(X_train, y_train * 1.3)

        test_score = float(model_mid.score(X_test, y_test))

        cv_scores = cross_val_score(
            GradientBoostingRegressor(**gb_params), X_scaled, y,
            cv=min(5, len(X_list)), scoring="r2"
        )
        cv_score = float(cv_scores.mean())

        self.model_mid      = model_mid
        self.model_low      = model_low
        self.model_high     = model_high
        self.scaler         = scaler
        self.pca            = pca
        self.function_types = function_types
        self.styles         = styles
        self.n_samples      = len(X_list)
        self.cv_score       = cv_score

        if os.path.exists(MODEL_PATH):
            os.remove(MODEL_PATH)

        joblib.dump(
            {
                "model_mid":      model_mid,
                "model_low":      model_low,
                "model_high":     model_high,
                "scaler":         scaler,
                "function_types": function_types,
                "styles":         styles,
                "n_samples":      len(X_list),
                "cv_score":       cv_score,
            },
            MODEL_PATH,
            protocol=4,
        )

        joblib.dump(pca, PCA_PATH, protocol=4)

        return {
            "method":   "ml",
            "samples":  len(X_list),
            "accuracy": round(test_score, 3),
            "cv_score": round(cv_score, 3),
        }

    def _is_decor_image(self, image_path: str) -> tuple[bool, str]:
        """Return (is_valid, reason). Rejects non-decor images via heuristics."""
        try:
            from ml.decor_features import extract_features
            feats = extract_features(image_path)
            brightness       = feats[9]
            complexity_score = feats[10]
            color_variance   = feats[11]
            warm_ratio       = feats[12]

            if warm_ratio > 0.55 and brightness > 0.55 and complexity_score < 0.18:
                return False, "skin-tone"
            if complexity_score < 0.05:
                return False, "plain"
            if color_variance < 0.03:
                return False, "low-variance"
        except Exception:
            pass
        return True, ""

    def _validate_image_strict(self, img):
        DECOR = ["altar", "arch", "candle", "flower", "bouquet",
                 "chandelier", "curtain", "lantern", "wreath",
                 "vase", "garden", "ballroom", "tent", "stage"]
        REJECT = ["screen", "monitor", "laptop", "keyboard",
                  "person", "face", "book", "phone", "street"]
        try:
            from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
            arr = preprocess_input(
                np.array(img.resize((224, 224)).convert('RGB'))[np.newaxis]
            )
            top    = decode_predictions(_get_mobilenet_classifier().predict(arr, verbose=0), top=5)[0]
            labels = [l.lower() for _, l, _ in top]
            scores = [float(s) for _, _, s in top]
            is_decor  = any(k in l for k in DECOR for l in labels)
            is_reject = any(k in l for k in REJECT for l in labels)
            if is_reject and not is_decor:
                return False, 0
            return True, min(round(scores[0] * 100 + 50, 1), 95)
        except Exception:
            return True, 50

    def _prediction_confidence(self, low: int, mid: int, high: int) -> float:
        """Dynamic confidence: 1 - (prediction_std / prediction_mean), clamped to [0.5, 0.99]."""
        if mid <= 0:
            return 0.5
        std_approx = (high - low) / 2.0
        conf = 1.0 - (std_approx / mid)
        return round(max(0.5, min(0.99, conf)), 2)

    def predict(self, image_path: str, function_type=None, style=None, complexity=None) -> dict:
        """Return cost prediction dict.

        Uses ML model when trained, otherwise falls back to rule-based ranges.
        """
        from PIL import Image
        img = Image.open(image_path)
        is_valid, confidence = self._validate_image_strict(img)
        if not is_valid:
            return {
                "predicted_low":  0,
                "predicted_mid":  0,
                "predicted_high": 0,
                "confidence":     0,
                "method":         "rejected",
                "message":        "Please upload a wedding decor image",
            }

        if self.model_mid is not None:
            from ml.decor_features import extract_features

            pixel_feats = extract_features(image_path)  # 19-dim
            embedding   = _extract_embedding(image_path)  # 1280-dim

            if self.pca is not None:
                embed_reduced = self.pca.transform(embedding[np.newaxis])[0]  # 50-dim
            else:
                embed_reduced = embedding[:50]

            ft_vec = [1.0 if function_type == ft else 0.0 for ft in self.function_types]
            st_vec = [1.0 if style == s else 0.0 for s in self.styles]
            comp   = (int(complexity) if complexity is not None else 3) / 5.0
            x_raw  = np.concatenate([pixel_feats, embed_reduced, ft_vec, st_vec, [comp]]).reshape(1, -1)

            x = self.scaler.transform(x_raw) if self.scaler is not None else x_raw

            mid  = int(self.model_mid.predict(x)[0])
            low  = int(self.model_low.predict(x)[0])
            high = int(self.model_high.predict(x)[0])

            from numpy import array as np_array
            all_preds = np_array([est.predict(x)[0] for est in self.model_mid.estimators_.ravel()])
            pred_std  = all_preds.std()
            pred_mean = all_preds.mean()
            if pred_mean != 0:
                conf = 1.0 - (pred_std / pred_mean)
            else:
                conf = 0.50
            confidence = round(max(0.50, min(0.95, conf)), 2)

            return {
                "predicted_low":  low,
                "predicted_mid":  mid,
                "predicted_high": high,
                "confidence":     confidence,
                "method":         "ml",
                "cv_score":       self.cv_score,
            }

        # Rule-based fallback
        c = int(complexity) if isinstance(complexity, (int, float)) else 3
        c = max(1, min(5, c))
        low, high = RULE_RANGES[c]
        mid = (low + high) // 2
        return {
            "predicted_low":  low,
            "predicted_mid":  mid,
            "predicted_high": high,
            "confidence":     0.50,
            "method":         "rule-based",
        }


# ── Module-level singleton ─────────────────────────────────────────────────────
_predictor: DecorCostPredictor | None = None


def get_predictor() -> DecorCostPredictor:
    global _predictor
    if _predictor is None:
        _predictor = DecorCostPredictor()
    return _predictor
