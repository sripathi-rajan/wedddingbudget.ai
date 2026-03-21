"""
retrain_with_real_images.py
----------------------------
Scans decor_dataset/data/images/ for real wedding decor images,
extracts lightweight visual features, trains a RandomForestRegressor,
and saves the model + meta ready for backend/app.py.

Usage (run from decor_dataset/):
    python scripts/retrain_with_real_images.py
"""

import csv
import json
import os
import random
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
from PIL import Image
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split
import joblib

# ---------------------------------------------------------------------------
# Paths  (all relative to decor_dataset/)
# ---------------------------------------------------------------------------
BASE        = Path(__file__).resolve().parent.parent
IMAGES_DIR  = BASE / "data" / "images"
EMBED_DIR   = BASE / "data" / "embeddings"
LABELS_CSV  = BASE / "data" / "labels.csv"
MODEL_DIR   = BASE / "models" / "v1"

EMBED_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Category config
# ---------------------------------------------------------------------------
CATEGORIES = {
    "mandap":    ("Mandap",    150000),
    "stage":     ("Stage",     100000),
    "entrance":  ("Entrance",   45000),
    "floral":    ("Floral",     55000),
    "reception": ("Reception", 120000),
    "table":     ("Table",      35000),
}

COMPLEXITY_MULT = {"Low": 0.6, "Medium": 1.0, "High": 1.6}

FUNC_TYPES  = ["Mandap", "Stage", "Entrance", "Floral", "Reception", "Table"]
COMPLEXITY  = ["Low", "Medium", "High"]
STYLES      = ["Traditional", "Modern", "Rustic", "Royal", "Minimalist", "Floral Garden"]

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# ---------------------------------------------------------------------------
# Feature extraction  (127-dim, no MobileNetV2 required)
# ---------------------------------------------------------------------------
def extract_features(img_path: Path) -> np.ndarray:
    img = Image.open(img_path).convert("RGB").resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    feats = []

    # Colour histogram per channel (32 bins × 3 = 96)
    for c in range(3):
        hist, _ = np.histogram(arr[:, :, c], bins=32, range=(0, 1))
        feats.extend(hist / (hist.sum() + 1e-8))

    # Per-quadrant colour stats (4 quads × 3 ch × 2 stats = 24)
    for q in [arr[:112, :112], arr[:112, 112:], arr[112:, :112], arr[112:, 112:]]:
        for c in range(3):
            feats.append(float(q[:, :, c].mean()))
            feats.append(float(q[:, :, c].std()))

    # Edge density + brightness stats (7)
    gray = arr.mean(axis=2)
    feats.append(float(np.abs(np.diff(gray, axis=1)).mean()))
    feats.append(float(np.abs(np.diff(gray, axis=0)).mean()))
    feats.append(float(gray.mean()))
    feats.append(float(gray.std()))
    feats.extend([float(np.percentile(gray.flatten(), p)) for p in [25, 50, 75]])

    return np.array(feats, dtype=np.float32)


# ---------------------------------------------------------------------------
# One-hot helpers
# ---------------------------------------------------------------------------
def one_hot(value: str, choices: list) -> list:
    return [1 if value == c else 0 for c in choices]


# ---------------------------------------------------------------------------
# Scan images
# ---------------------------------------------------------------------------
def collect_images() -> list[dict]:
    records = []

    # 1. Subfolder images  (data/images/mandap/*.jpg etc.)
    for folder_name, (func_type, base_cost) in CATEGORIES.items():
        folder = IMAGES_DIR / folder_name
        if not folder.exists():
            print(f"  [skip] folder not found: {folder}")
            continue
        imgs = [f for f in folder.iterdir() if f.suffix.lower() in IMG_EXTS]
        if not imgs:
            print(f"  [skip] no images in: {folder}")
            continue
        for img_path in sorted(imgs):
            records.append({
                "abs_path":     img_path,
                "filename":     f"{folder_name}/{img_path.name}",
                "function_type": func_type,
                "base_cost":    base_cost,
                "complexity":   "Medium",
                "style":        "Traditional",
            })
        print(f"  {folder_name}/  →  {len(imgs)} images")

    # 2. Flat decor_*.jpg directly in data/images/
    flat = [f for f in IMAGES_DIR.glob("decor_*.jpg") if f.is_file()]
    for img_path in sorted(flat):
        records.append({
            "abs_path":     img_path,
            "filename":     img_path.name,
            "function_type": "Mandap",   # default for unlabelled flat images
            "base_cost":    150000,
            "complexity":   "Medium",
            "style":        "Traditional",
        })
    if flat:
        print(f"  data/images/ (flat)  →  {len(flat)} images")

    return records


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    random.seed(42)
    print(f"\nScanning {IMAGES_DIR} ...\n")

    records = collect_images()

    if len(records) < 5:
        print(f"\n❌  Only {len(records)} images found — need at least 5 to train.")
        print("    Add images to decor_dataset/data/images/<category>/ and retry.")
        sys.exit(1)

    print(f"\nFound {len(records)} images total. Extracting features...\n")

    # ── Extract embeddings ───────────────────────────────────────────────────
    X_rows, y_rows, embed_names = [], [], []
    failed = 0
    cat_counters: dict[str, int] = {}

    for rec in records:
        folder_key = rec["filename"].split("/")[0] if "/" in rec["filename"] else "flat"
        cat_counters[folder_key] = cat_counters.get(folder_key, 0) + 1
        n = cat_counters[folder_key]
        embed_name = f"{folder_key}_{n}"

        try:
            feats = extract_features(rec["abs_path"])
        except Exception as e:
            print(f"  [skip] {rec['filename']}: {e}")
            failed += 1
            continue

        # Save embedding
        npy_path = EMBED_DIR / f"{embed_name}.npy"
        np.save(npy_path, feats)
        rec["embedding_path"] = str(npy_path)
        embed_names.append(embed_name)

        # Build full feature vector
        oh_func  = one_hot(rec["function_type"], FUNC_TYPES)
        oh_comp  = one_hot(rec["complexity"],    COMPLEXITY)
        X_rows.append(np.concatenate([feats, oh_func, oh_comp]))

        # Target with complexity multiplier + noise
        mult  = COMPLEXITY_MULT.get(rec["complexity"], 1.0)
        noise = random.uniform(0.85, 1.15)
        y_rows.append(rec["base_cost"] * mult * noise)

        print(f"  ✓  {rec['filename']}  ({rec['function_type']})")

    n_ok = len(X_rows)
    if n_ok < 5:
        print(f"\n❌  Only {n_ok} images processed successfully — need at least 5.")
        sys.exit(1)

    # ── Write labels.csv ─────────────────────────────────────────────────────
    with open(LABELS_CSV, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["filename", "function_type", "style", "complexity", "base_cost"])
        for rec in records:
            if "embedding_path" in rec:
                writer.writerow([
                    rec["filename"], rec["function_type"],
                    rec["style"],    rec["complexity"], rec["base_cost"]
                ])
    print(f"\nLabels CSV updated  →  {LABELS_CSV}")

    # ── Train ────────────────────────────────────────────────────────────────
    X = np.array(X_rows, dtype=np.float32)
    y = np.array(y_rows, dtype=np.float32)

    if n_ok >= 10:
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
        eval_set = (X_te, y_te)
    else:
        X_tr, y_tr = X, y
        eval_set   = (X, y)

    print(f"\nTraining RandomForestRegressor on {len(X_tr)} samples...")
    model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
    model.fit(X_tr, y_tr)

    mae = mean_absolute_error(eval_set[1], model.predict(eval_set[0]))
    print(f"MAE (validation): ₹{mae:,.0f}")

    # ── Save model + meta ────────────────────────────────────────────────────
    model_path = MODEL_DIR / "cost_predictor.joblib"
    meta_path  = MODEL_DIR / "meta.json"

    joblib.dump(model, model_path)

    meta = {
        "n_samples":  n_ok,
        "mae":        round(float(mae), 2),
        "trained_at": datetime.now().isoformat(timespec="seconds"),
        "model_path": str(model_path),
        "feature_dim": int(X.shape[1]),
        "func_types":  FUNC_TYPES,
        "complexities": COMPLEXITY,
    }
    meta_path.write_text(json.dumps(meta, indent=2))

    print(f"Model saved  →  {model_path}")
    print(f"Meta saved   →  {meta_path}")

    # ── Summary ──────────────────────────────────────────────────────────────
    print(f"\nRetrained on {n_ok} real images. MAE: Rs.{mae:,.0f}")
    print("Restart python backend/app.py to use the new model")


if __name__ == "__main__":
    main()
