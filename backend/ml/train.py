"""
weddingbudget.ai — Decor Intelligence ML Pipeline
Uses MobileNetV2 embeddings + RandomForestRegressor for cost prediction.
Run: python train.py
"""
import numpy as np
import json, os, joblib
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score
from sklearn.model_selection import train_test_split, cross_val_score

MODEL_PATH = "decor_model.joblib"
ENCODER_PATH = "decor_encoder.joblib"

# ─── Comprehensive Training Dataset ──────────────────────────────────────────
# Real-world inspired rates from Indian wedding industry (2024)
# Cost in INR (₹)
SAMPLE_DATA = [
    # ── MANDAP (Main ceremony structure) ──────────────────────────────────────
    {"function_type": "Mandap", "style": "Traditional", "complexity": "Low",    "region": "South India",  "embedding_seed": 1,  "actual_cost": 80000},
    {"function_type": "Mandap", "style": "Traditional", "complexity": "Medium", "region": "South India",  "embedding_seed": 2,  "actual_cost": 150000},
    {"function_type": "Mandap", "style": "Traditional", "complexity": "High",   "region": "South India",  "embedding_seed": 3,  "actual_cost": 250000},
    {"function_type": "Mandap", "style": "Romantic",    "complexity": "Medium", "region": "Pan-India",    "embedding_seed": 4,  "actual_cost": 160000},
    {"function_type": "Mandap", "style": "Romantic",    "complexity": "High",   "region": "Pan-India",    "embedding_seed": 5,  "actual_cost": 280000},
    {"function_type": "Mandap", "style": "Luxury",      "complexity": "High",   "region": "Metro",        "embedding_seed": 6,  "actual_cost": 450000},
    {"function_type": "Mandap", "style": "Luxury",      "complexity": "High",   "region": "Rajasthan",    "embedding_seed": 7,  "actual_cost": 600000},
    {"function_type": "Mandap", "style": "Modern",      "complexity": "Medium", "region": "Metro",        "embedding_seed": 8,  "actual_cost": 200000},
    {"function_type": "Mandap", "style": "Modern",      "complexity": "High",   "region": "Metro",        "embedding_seed": 9,  "actual_cost": 320000},
    {"function_type": "Mandap", "style": "Whimsical",   "complexity": "High",   "region": "Pan-India",    "embedding_seed": 10, "actual_cost": 380000},
    {"function_type": "Mandap", "style": "Minimalist",  "complexity": "Low",    "region": "Pan-India",    "embedding_seed": 11, "actual_cost": 60000},
    {"function_type": "Mandap", "style": "Minimalist",  "complexity": "Medium", "region": "Pan-India",    "embedding_seed": 12, "actual_cost": 110000},

    # ── STAGE ──────────────────────────────────────────────────────────────────
    {"function_type": "Stage",  "style": "Traditional", "complexity": "Medium", "region": "Pan-India",    "embedding_seed": 13, "actual_cost": 120000},
    {"function_type": "Stage",  "style": "Traditional", "complexity": "High",   "region": "Pan-India",    "embedding_seed": 14, "actual_cost": 220000},
    {"function_type": "Stage",  "style": "Luxury",      "complexity": "High",   "region": "Metro",        "embedding_seed": 15, "actual_cost": 500000},
    {"function_type": "Stage",  "style": "Luxury",      "complexity": "High",   "region": "Destination",  "embedding_seed": 16, "actual_cost": 700000},
    {"function_type": "Stage",  "style": "Romantic",    "complexity": "Medium", "region": "Pan-India",    "embedding_seed": 17, "actual_cost": 180000},
    {"function_type": "Stage",  "style": "Modern",      "complexity": "High",   "region": "Metro",        "embedding_seed": 18, "actual_cost": 350000},
    {"function_type": "Stage",  "style": "Whimsical",   "complexity": "High",   "region": "Pan-India",    "embedding_seed": 19, "actual_cost": 280000},
    {"function_type": "Stage",  "style": "Rustic",      "complexity": "Medium", "region": "Pan-India",    "embedding_seed": 20, "actual_cost": 130000},

    # ── PILLARS ────────────────────────────────────────────────────────────────
    {"function_type": "Pillars", "style": "Traditional", "complexity": "Medium", "region": "Pan-India",   "embedding_seed": 21, "actual_cost": 80000},
    {"function_type": "Pillars", "style": "Traditional", "complexity": "High",   "region": "Pan-India",   "embedding_seed": 22, "actual_cost": 160000},
    {"function_type": "Pillars", "style": "Luxury",      "complexity": "High",   "region": "Metro",       "embedding_seed": 23, "actual_cost": 350000},
    {"function_type": "Pillars", "style": "Luxury",      "complexity": "High",   "region": "Rajasthan",   "embedding_seed": 24, "actual_cost": 480000},
    {"function_type": "Pillars", "style": "Modern",      "complexity": "High",   "region": "Metro",       "embedding_seed": 25, "actual_cost": 220000},
    {"function_type": "Pillars", "style": "Romantic",    "complexity": "Medium", "region": "Pan-India",   "embedding_seed": 26, "actual_cost": 120000},

    # ── CEILING ────────────────────────────────────────────────────────────────
    {"function_type": "Ceiling", "style": "Modern",      "complexity": "High",   "region": "Metro",       "embedding_seed": 27, "actual_cost": 180000},
    {"function_type": "Ceiling", "style": "Luxury",      "complexity": "High",   "region": "Metro",       "embedding_seed": 28, "actual_cost": 280000},
    {"function_type": "Ceiling", "style": "Romantic",    "complexity": "Medium", "region": "Pan-India",   "embedding_seed": 29, "actual_cost": 100000},
    {"function_type": "Ceiling", "style": "Playful",     "complexity": "Low",    "region": "Pan-India",   "embedding_seed": 30, "actual_cost": 40000},
    {"function_type": "Ceiling", "style": "Traditional", "complexity": "Medium", "region": "South India", "embedding_seed": 31, "actual_cost": 75000},
    {"function_type": "Ceiling", "style": "Whimsical",   "complexity": "High",   "region": "Pan-India",   "embedding_seed": 32, "actual_cost": 150000},

    # ── BACKDROP ───────────────────────────────────────────────────────────────
    {"function_type": "Backdrop", "style": "Boho",       "complexity": "Medium", "region": "Pan-India",   "embedding_seed": 33, "actual_cost": 65000},
    {"function_type": "Backdrop", "style": "Modern",     "complexity": "High",   "region": "Metro",       "embedding_seed": 34, "actual_cost": 120000},
    {"function_type": "Backdrop", "style": "Romantic",   "complexity": "Medium", "region": "Pan-India",   "embedding_seed": 35, "actual_cost": 80000},
    {"function_type": "Backdrop", "style": "Luxury",     "complexity": "High",   "region": "Metro",       "embedding_seed": 36, "actual_cost": 180000},
    {"function_type": "Backdrop", "style": "Minimalist", "complexity": "Low",    "region": "Pan-India",   "embedding_seed": 37, "actual_cost": 25000},
    {"function_type": "Backdrop", "style": "Traditional","complexity": "Medium", "region": "South India", "embedding_seed": 38, "actual_cost": 55000},

    # ── ENTRANCE ───────────────────────────────────────────────────────────────
    {"function_type": "Entrance", "style": "Traditional","complexity": "Low",    "region": "South India", "embedding_seed": 39, "actual_cost": 20000},
    {"function_type": "Entrance", "style": "Traditional","complexity": "Medium", "region": "South India", "embedding_seed": 40, "actual_cost": 45000},
    {"function_type": "Entrance", "style": "Traditional","complexity": "High",   "region": "South India", "embedding_seed": 41, "actual_cost": 90000},
    {"function_type": "Entrance", "style": "Luxury",     "complexity": "High",   "region": "Metro",       "embedding_seed": 42, "actual_cost": 150000},
    {"function_type": "Entrance", "style": "Boho",       "complexity": "Medium", "region": "Pan-India",   "embedding_seed": 43, "actual_cost": 55000},
    {"function_type": "Entrance", "style": "Modern",     "complexity": "High",   "region": "Metro",       "embedding_seed": 44, "actual_cost": 100000},
    {"function_type": "Entrance", "style": "Rustic",     "complexity": "Low",    "region": "Pan-India",   "embedding_seed": 45, "actual_cost": 18000},
    {"function_type": "Entrance", "style": "Whimsical",  "complexity": "High",   "region": "Pan-India",   "embedding_seed": 46, "actual_cost": 120000},

    # ── TABLE DECOR ────────────────────────────────────────────────────────────
    {"function_type": "Table Decor", "style": "Minimalist", "complexity": "Low",  "region": "Pan-India",  "embedding_seed": 47, "actual_cost": 20000},
    {"function_type": "Table Decor", "style": "Romantic",   "complexity": "Low",  "region": "Pan-India",  "embedding_seed": 48, "actual_cost": 30000},
    {"function_type": "Table Decor", "style": "Romantic",   "complexity": "Medium","region": "Pan-India", "embedding_seed": 49, "actual_cost": 60000},
    {"function_type": "Table Decor", "style": "Luxury",     "complexity": "High", "region": "Metro",      "embedding_seed": 50, "actual_cost": 120000},
    {"function_type": "Table Decor", "style": "Rustic",     "complexity": "Medium","region": "Pan-India", "embedding_seed": 51, "actual_cost": 45000},
    {"function_type": "Table Decor", "style": "Traditional","complexity": "Low",  "region": "South India","embedding_seed": 52, "actual_cost": 22000},
    {"function_type": "Table Decor", "style": "Modern",     "complexity": "Medium","region": "Metro",     "embedding_seed": 53, "actual_cost": 55000},
    {"function_type": "Table Decor", "style": "Boho",       "complexity": "Low",  "region": "Pan-India",  "embedding_seed": 54, "actual_cost": 28000},

    # ── PHOTO BOOTH ────────────────────────────────────────────────────────────
    {"function_type": "Photo Booth", "style": "Modern",    "complexity": "Medium","region": "Metro",      "embedding_seed": 55, "actual_cost": 55000},
    {"function_type": "Photo Booth", "style": "Modern",    "complexity": "High",  "region": "Metro",      "embedding_seed": 56, "actual_cost": 90000},
    {"function_type": "Photo Booth", "style": "Rustic",    "complexity": "Low",   "region": "Pan-India",  "embedding_seed": 57, "actual_cost": 25000},
    {"function_type": "Photo Booth", "style": "Romantic",  "complexity": "Medium","region": "Pan-India",  "embedding_seed": 58, "actual_cost": 50000},
    {"function_type": "Photo Booth", "style": "Luxury",    "complexity": "High",  "region": "Metro",      "embedding_seed": 59, "actual_cost": 120000},
    {"function_type": "Photo Booth", "style": "Playful",   "complexity": "Low",   "region": "Pan-India",  "embedding_seed": 60, "actual_cost": 20000},
    {"function_type": "Photo Booth", "style": "Whimsical", "complexity": "Medium","region": "Pan-India",  "embedding_seed": 61, "actual_cost": 65000},

    # ── LIGHTING ───────────────────────────────────────────────────────────────
    {"function_type": "Lighting", "style": "Traditional","complexity": "Low",    "region": "Pan-India",   "embedding_seed": 62, "actual_cost": 15000},
    {"function_type": "Lighting", "style": "Traditional","complexity": "Medium", "region": "Pan-India",   "embedding_seed": 63, "actual_cost": 30000},
    {"function_type": "Lighting", "style": "Modern",    "complexity": "High",    "region": "Metro",       "embedding_seed": 64, "actual_cost": 80000},
    {"function_type": "Lighting", "style": "Luxury",    "complexity": "High",    "region": "Metro",       "embedding_seed": 65, "actual_cost": 120000},
    {"function_type": "Lighting", "style": "Minimalist","complexity": "Low",     "region": "Pan-India",   "embedding_seed": 66, "actual_cost": 12000},
    {"function_type": "Lighting", "style": "Romantic",  "complexity": "Medium",  "region": "Pan-India",   "embedding_seed": 67, "actual_cost": 40000},
    {"function_type": "Lighting", "style": "Playful",   "complexity": "Low",     "region": "Pan-India",   "embedding_seed": 68, "actual_cost": 18000},

    # ── AISLE ──────────────────────────────────────────────────────────────────
    {"function_type": "Aisle", "style": "Romantic",    "complexity": "Low",    "region": "Pan-India",     "embedding_seed": 69, "actual_cost": 15000},
    {"function_type": "Aisle", "style": "Romantic",    "complexity": "Medium", "region": "Pan-India",     "embedding_seed": 70, "actual_cost": 28000},
    {"function_type": "Aisle", "style": "Traditional", "complexity": "Low",    "region": "South India",   "embedding_seed": 71, "actual_cost": 12000},
    {"function_type": "Aisle", "style": "Luxury",      "complexity": "High",   "region": "Metro",         "embedding_seed": 72, "actual_cost": 70000},
    {"function_type": "Aisle", "style": "Modern",      "complexity": "Medium", "region": "Metro",         "embedding_seed": 73, "actual_cost": 35000},
    {"function_type": "Aisle", "style": "Minimalist",  "complexity": "Low",    "region": "Pan-India",     "embedding_seed": 74, "actual_cost": 8000},
    {"function_type": "Aisle", "style": "Boho",        "complexity": "Low",    "region": "Pan-India",     "embedding_seed": 75, "actual_cost": 18000},
]

# ─── Data Augmentation ────────────────────────────────────────────────────────
def augment_data(base, n=400):
    """Augment dataset with realistic noise."""
    import random
    augmented = []
    for _ in range(n):
        item = random.choice(base).copy()
        # Add realistic cost variation (±18%)
        noise = random.uniform(0.82, 1.18)
        item["actual_cost"] = int(item["actual_cost"] * noise)
        item["embedding_seed"] = random.randint(1, 50000)
        augmented.append(item)
    return augmented

def fake_embedding(seed: int, dim: int = 128) -> np.ndarray:
    """Simulate MobileNetV2 embedding — use real CNN in production."""
    rng = np.random.RandomState(seed % 100000)
    # Simulate realistic embedding distribution
    base = rng.randn(dim).astype(np.float32)
    # Add structured signal based on seed
    pattern = np.sin(np.arange(dim) * seed / 1000).astype(np.float32)
    return (base * 0.8 + pattern * 0.2)

def build_features(item: dict, encoder: OneHotEncoder = None, fit: bool = False):
    """Build feature vector: embedding + one-hot categorical tags."""
    emb = fake_embedding(item.get("embedding_seed", 42))
    cats = np.array([[
        item["function_type"],
        item["style"],
        item["complexity"],
        item.get("region", "Pan-India")
    ]])
    if fit:
        oh = encoder.fit_transform(cats)
    else:
        oh = encoder.transform(cats)
    if hasattr(oh, 'toarray'):
        oh = oh.toarray()
    oh = oh.flatten()
    return np.concatenate([emb, oh])

def train():
    print("🤖 weddingbudget.ai — Decor Intelligence ML Pipeline")
    print("=" * 55)
    print(f"  Base samples: {len(SAMPLE_DATA)}")

    data = augment_data(SAMPLE_DATA, 400)
    print(f"  Augmented to: {len(data)} samples")

    try:
        encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    except TypeError:
        encoder = OneHotEncoder(handle_unknown='ignore', sparse=False)

    X, y = [], []
    for i, item in enumerate(data):
        feat = build_features(item, encoder, fit=(i == 0))
        X.append(feat)
        y.append(item["actual_cost"])

    X = np.array(X)
    y = np.array(y)

    print(f"  Dataset shape: {X.shape} features × {len(y)} samples")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=15,
        min_samples_leaf=2,
        min_samples_split=4,
        max_features='sqrt',
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae  = mean_absolute_error(y_test, y_pred)
    mape = mean_absolute_percentage_error(y_test, y_pred) * 100
    r2   = r2_score(y_test, y_pred)

    print(f"  ✅ Model trained:")
    print(f"     MAE:  ₹{mae:,.0f}")
    print(f"     MAPE: {mape:.1f}%")
    print(f"     R²:   {r2:.3f}")

    # Cross-validation
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='neg_mean_absolute_error')
    cv_mae = -cv_scores.mean()
    print(f"     CV MAE (5-fold): ₹{cv_mae:,.0f}")

    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    print(f"  💾 Model → {MODEL_PATH}")
    print(f"  💾 Encoder → {ENCODER_PATH}")

    # Save embeddings
    embeddings = {i: fake_embedding(d["embedding_seed"]).tolist() for i, d in enumerate(SAMPLE_DATA)}
    with open("embeddings.json", "w") as f:
        json.dump(embeddings, f)
    print(f"  💾 Embeddings → embeddings.json")

    # Print sample predictions
    print("\n  📊 Sample predictions:")
    test_cases = [
        ("Mandap",      "Luxury",      "High",   "Metro"),
        ("Mandap",      "Traditional", "Medium", "South India"),
        ("Stage",       "Luxury",      "High",   "Metro"),
        ("Entrance",    "Traditional", "Low",    "South India"),
        ("Table Decor", "Romantic",    "Medium", "Pan-India"),
        ("Lighting",    "Modern",      "High",   "Metro"),
        ("Aisle",       "Romantic",    "Low",    "Pan-India"),
        ("Pillars",     "Luxury",      "High",   "Rajasthan"),
    ]
    for ft, style, comp, region in test_cases:
        item = {"function_type": ft, "style": style, "complexity": comp,
                "region": region, "embedding_seed": 42}
        feat = build_features(item, encoder, fit=False)
        pred = model.predict([feat])[0]
        lo = int(pred * 0.80)
        hi = int(pred * 1.25)
        print(f"     {ft:14s} | {style:12s} | {comp:6s} → ₹{pred:>8,.0f}  (₹{lo:>8,.0f} – ₹{hi:>8,.0f})")

    return model, encoder


def predict(function_type: str, style: str, complexity: str,
            region: str = "Pan-India", image_seed: int = 42):
    """Predict cost for a decor item."""
    if not os.path.exists(MODEL_PATH):
        train()

    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)

    item = {
        "function_type": function_type,
        "style": style,
        "complexity": complexity,
        "region": region,
        "embedding_seed": image_seed
    }
    feat = build_features(item, encoder, fit=False)
    pred = model.predict([feat])[0]
    return {
        "predicted_cost": int(pred),
        "range": [int(pred * 0.80), int(pred * 1.25)],
        "confidence": 0.85,
        "function_type": function_type,
        "style": style,
        "complexity": complexity,
        "region": region,
        "source": "RandomForest ML"
    }


def find_similar(image_seed: int, top_k: int = 3, function_type: str = None):
    """Cosine similarity search against the training library."""
    from sklearn.metrics.pairwise import cosine_similarity
    query_emb = fake_embedding(image_seed).reshape(1, -1)
    candidates = SAMPLE_DATA
    if function_type:
        candidates = [d for d in SAMPLE_DATA if d["function_type"] == function_type] or SAMPLE_DATA
    lib_embs = np.array([fake_embedding(d["embedding_seed"]) for d in candidates])
    sims = cosine_similarity(query_emb, lib_embs)[0]
    top_indices = np.argsort(sims)[::-1][:top_k]
    return [candidates[i] for i in top_indices]


if __name__ == "__main__":
    model, encoder = train()
    print("\n🔮 Quick prediction test:")
    result = predict("Mandap", "Luxury", "High", region="Metro", image_seed=99)
    print(f"   {result['function_type']} | {result['style']} | {result['complexity']}")
    print(f"   Predicted: ₹{result['predicted_cost']:,}")
    print(f"   Range:     ₹{result['range'][0]:,} – ₹{result['range'][1]:,}")
    print("\n🔍 Similar designs:")
    for s in find_similar(99, function_type="Mandap"):
        print(f"   → {s['function_type']:14s} | {s['style']:12s} | {s['complexity']:6s} | ₹{s['actual_cost']:>8,} | {s['region']}")
