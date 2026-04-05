"""Auto-label all images in decor_dataset using MobileNetV2 embeddings + KMeans clustering.

Run on startup (via main.py) when fewer than 200 labelled images exist.
Can also be run standalone: python ml/auto_label.py
"""
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "decor_dataset", "data", "images")
LABELS_CSV = os.path.join(os.path.dirname(os.path.dirname(__file__)), "decor_dataset", "data", "labels.csv")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Base costs (INR) per folder/function_type
FOLDER_BASE_COSTS = {
    "entrance":  75_000,
    "mandap":   750_000,
    "stage":    400_000,
    "backdrop":  85_000,
    "ceiling":  180_000,
    "table":     45_000,
    "lighting":  35_000,
    "floral":    95_000,
}
DEFAULT_BASE_COST = 60_000

# Complexity multipliers by tier
COMPLEXITY_MULTIPLIERS = {1: 0.5, 2: 0.75, 3: 1.0, 4: 1.5, 5: 2.5}

# KMeans cluster → style mapping (fixed assignment)
CLUSTER_STYLE_MAP = {
    0: "Traditional",
    1: "Romantic",
    2: "Modern",
    3: "Minimalist",
    4: "Luxury",
    5: "Boho",
}

FIELDNAMES = ["filename", "function_type", "style", "complexity", "seed_cost"]


def _collect_images() -> list[tuple[str, str, str]]:
    """Return list of (unique_filename, subfolder, abs_path) for all images."""
    items = []
    if not os.path.isdir(IMAGES_DIR):
        return items
    for subfolder in sorted(os.listdir(IMAGES_DIR)):
        subfolder_path = os.path.join(IMAGES_DIR, subfolder)
        if not os.path.isdir(subfolder_path):
            continue
        for fname in sorted(os.listdir(subfolder_path)):
            ext = os.path.splitext(fname)[1].lower()
            if ext not in IMAGE_EXTENSIONS:
                continue
            unique_filename = f"{subfolder}/{fname}"
            abs_path = os.path.join(subfolder_path, fname)
            items.append((unique_filename, subfolder, abs_path))
    return items


def _extract_mobilenet_embeddings(image_paths: list[str]) -> "np.ndarray":
    """Extract 1280-dim MobileNetV2 global_average_pooling embeddings."""
    import numpy as np
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
    from tensorflow.keras.models import Model
    from PIL import Image

    base = MobileNetV2(weights="imagenet", include_top=False, pooling="avg", input_shape=(224, 224, 3))

    embeddings = []
    for path in image_paths:
        try:
            img = Image.open(path).convert("RGB").resize((224, 224))
            arr = preprocess_input(
                __import__("numpy").array(img, dtype="float32")[None]
            )
            emb = base.predict(arr, verbose=0)[0]
        except Exception:
            emb = __import__("numpy").zeros(1280, dtype="float32")
        embeddings.append(emb)
    return __import__("numpy").array(embeddings, dtype="float32")


def _infer_complexity_from_score(complexity_score: float) -> int:
    """Map extract_features()[10] complexity_score to 1-5 complexity level."""
    if complexity_score < 0.1:
        return 1
    if complexity_score < 0.2:
        return 2
    if complexity_score < 0.3:
        return 3
    if complexity_score < 0.4:
        return 4
    return 5


def _read_labels() -> dict:
    labels = {}
    if not os.path.exists(LABELS_CSV):
        return labels
    with open(LABELS_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            labels[row["filename"]] = row
    return labels


def _write_labels(labels: dict):
    os.makedirs(os.path.dirname(LABELS_CSV), exist_ok=True)
    with open(LABELS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for row in labels.values():
            writer.writerow({k: row.get(k, "") for k in FIELDNAMES})


def run_auto_label(force: bool = False) -> int:
    """Auto-label all images using MobileNetV2 + KMeans(k=6).

    Returns number of images newly labelled.
    Skips re-labelling if labels >= 200 and not forced.
    """
    import numpy as np
    from sklearn.cluster import KMeans
    from ml.decor_features import extract_features

    items = _collect_images()
    if not items:
        return 0

    existing = _read_labels()
    if not force and len(existing) >= 200:
        return 0

    image_paths = [abs_path for _, _, abs_path in items]

    # Extract MobileNetV2 embeddings for all images
    embeddings = _extract_mobilenet_embeddings(image_paths)

    # Cluster into 6 styles
    kmeans = KMeans(n_clusters=6, random_state=42, n_init=10)
    cluster_ids = kmeans.fit_predict(embeddings)

    labels = dict(existing)  # preserve any existing manual labels
    rng = np.random.default_rng(seed=0)
    labelled = 0

    for (unique_filename, subfolder, abs_path), cluster_id in zip(items, cluster_ids):
        function_type = subfolder.lower()
        base_cost = FOLDER_BASE_COSTS.get(function_type, DEFAULT_BASE_COST)
        style = CLUSTER_STYLE_MAP[int(cluster_id)]

        try:
            feats = extract_features(abs_path)
            complexity_score = float(feats[10])
        except Exception:
            complexity_score = 0.25
        complexity = _infer_complexity_from_score(complexity_score)

        multiplier = COMPLEXITY_MULTIPLIERS[complexity]
        variance = rng.uniform(-0.05, 0.05) * base_cost * multiplier
        seed_cost = round(base_cost * multiplier + variance)

        labels[unique_filename] = {
            "filename":      unique_filename,
            "function_type": function_type,
            "style":         style,
            "complexity":    str(complexity),
            "seed_cost":     str(seed_cost),
        }
        labelled += 1

    _write_labels(labels)
    return labelled


async def maybe_auto_label() -> int:
    """Called on startup: auto-label if fewer than 200 labelled images exist.

    Returns count of newly labelled images.
    """
    import logging
    labels = _read_labels()
    if len(labels) >= 200:
        return 0
    count = run_auto_label()
    if count > 0:
        logging.getLogger(__name__).info(
            "auto_label: labelled %d images (total now %d)", count, len(_read_labels())
        )
    return count


if __name__ == "__main__":
    force = "--force" in sys.argv
    n = run_auto_label(force=force)
    print(f"Auto-labelled {n} images. Total: {len(_read_labels())}")
