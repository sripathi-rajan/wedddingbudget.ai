"""Decor AI router — library browsing, cost prediction, file-upload prediction."""
import os
import random
import tempfile
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import get_db
from models import DecorImage

router = APIRouter()

IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "decor_dataset", "data", "images")

# ── Hardcoded fallback library (used when DB is empty or unavailable) ──────────
_FALLBACK_LIBRARY = [
    {"id": 1,  "emoji": "🌸", "name": "Floral Arch Mandap",       "style": "Romantic",    "complexity": 4, "base_cost": 200000, "function_type": "Mandap"},
    {"id": 2,  "emoji": "🕯️", "name": "Candle Centerpieces",       "style": "Minimalist",  "complexity": 1, "base_cost": 40000,  "function_type": "Table Decor"},
    {"id": 3,  "emoji": "🌺", "name": "Marigold Garland Entrance", "style": "Traditional", "complexity": 2, "base_cost": 50000,  "function_type": "Entrance"},
    {"id": 4,  "emoji": "✨", "name": "LED Fairy Light Ceiling",   "style": "Modern",      "complexity": 4, "base_cost": 130000, "function_type": "Ceiling"},
    {"id": 5,  "emoji": "🌿", "name": "Tropical Leaf Backdrop",    "style": "Boho",        "complexity": 3, "base_cost": 70000,  "function_type": "Backdrop"},
    {"id": 6,  "emoji": "🦋", "name": "Floral Stage Decor",        "style": "Whimsical",   "complexity": 5, "base_cost": 250000, "function_type": "Stage"},
]

RULE_RANGES = {1: (30_000, 80_000), 2: (80_000, 200_000), 3: (200_000, 500_000),
               4: (500_000, 1_000_000), 5: (1_000_000, 2_500_000)}

FUNCTION_TYPE_COLORS = {
    "Mandap": "#7C3AED", "Entrance": "#059669", "Table Decor": "#D97706",
    "Ceiling": "#0284C7", "Backdrop": "#DB2777", "Stage": "#DC2626",
    "Lighting": "#F59E0B", "Photo Booth": "#7C3AED", "Aisle": "#059669",
    "Pillars": "#6B7280",
}


def _rule_predict(complexity: int | None):
    c = max(1, min(5, int(complexity or 3)))
    low, high = RULE_RANGES[c]
    mid = (low + high) // 2
    return {"predicted_low": low, "predicted_mid": mid, "predicted_high": high,
            "confidence": 0.50, "method": "rule-based"}


def _ml_predict(image_path: str, function_type=None, style=None, complexity=None):
    try:
        from ml.decor_model import get_predictor
        return get_predictor().predict(image_path, function_type, style, complexity)
    except Exception:
        return _rule_predict(complexity)


# ── GET /library ───────────────────────────────────────────────────────────────
@router.get("/library")
async def get_library(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    function_type: Optional[str] = None,
    style: Optional[str] = None,
    is_labelled: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(DecorImage)
    if function_type:
        q = q.where(DecorImage.function_type == function_type)
    if style:
        q = q.where(DecorImage.style == style)
    if is_labelled is not None:
        q = q.where(DecorImage.is_labelled == is_labelled)

    count_q = select(func.count()).select_from(q.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    q = q.offset((page - 1) * limit).limit(limit)
    result = await db.execute(q)
    images = result.scalars().all()

    if not images and page == 1:
        # Return hardcoded fallback so UI never breaks
        items = []
        for d in _FALLBACK_LIBRARY:
            p = _rule_predict(d["complexity"])
            items.append({**d, "url": None, "filename": d["name"],
                          "is_labelled": False, **p,
                          "badge_color": FUNCTION_TYPE_COLORS.get(d["function_type"], "#6B7280")})
        return {"items": items, "total": len(items), "page": 1, "limit": limit, "source": "fallback"}

    items = []
    for img in images:
        img_path = os.path.join(IMAGES_DIR, img.filename) if img.filename else ""
        pred = _ml_predict(img_path, img.function_type, img.style, img.complexity)
        items.append({
            "id": img.id,
            "filename": img.filename,
            "url": img.url or (f"/decor-images/{img.filename}" if img.filename else None),
            "image_url": img.url or (f"/decor-images/{img.filename}" if img.filename else None),
            "function_type": img.function_type,
            "style": img.style,
            "complexity": img.complexity,
            "seed_cost": img.seed_cost,
            "is_labelled": img.is_labelled,
            "badge_color": FUNCTION_TYPE_COLORS.get(img.function_type or "", "#6B7280"),
            **pred,
        })

    return {"items": items, "total": total, "page": page, "limit": limit, "source": "db"}


# ── POST /predict — by image_id (DB image) ────────────────────────────────────
class PredictByIdRequest(BaseModel):
    image_id: int


@router.post("/predict")
async def predict_by_id(req: PredictByIdRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DecorImage).where(DecorImage.id == req.image_id))
    img = result.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    img_path = os.path.join(IMAGES_DIR, img.filename) if img.filename else ""
    pred = _ml_predict(img_path, img.function_type, img.style, img.complexity)
    return {"image_id": img.id, **pred}


# ── POST /predict-upload — multipart file, no DB save ─────────────────────────
@router.post("/predict-upload")
async def predict_upload(
    file: UploadFile = File(...),
    function_type: Optional[str] = None,
    style: Optional[str] = None,
    complexity: Optional[int] = None,
):
    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        pred = _ml_predict(tmp_path, function_type, style, complexity)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    return pred


# ── Legacy predict endpoint (kept for existing AI Cost Predictor UI) ──────────
class LegacyPredictRequest(BaseModel):
    function_type: str
    style: str
    complexity: str
    image_seed: Optional[int] = 42
    region: Optional[str] = "Pan-India"


@router.post("/predict-legacy")
def predict_legacy(req: LegacyPredictRequest):
    try:
        from ml.train import predict as ml_predict, find_similar
        result = ml_predict(req.function_type, req.style, req.complexity,
                            region=req.region, image_seed=req.image_seed)
        similar = find_similar(req.image_seed, top_k=3, function_type=req.function_type)
        return {"predicted_cost": result["predicted_cost"], "range": result["range"],
                "confidence": result["confidence"], "similar_items": similar, "source": "RandomForest ML"}
    except Exception:
        base_map = {"Mandap": 180000, "Entrance": 50000, "Table Decor": 40000, "Ceiling": 80000,
                    "Backdrop": 60000, "Stage": 200000, "Lighting": 25000, "Photo Booth": 55000,
                    "Aisle": 20000, "Pillars": 250000}
        base = base_map.get(req.function_type, 60000)
        mult = {"Low": 0.75, "Medium": 1.0, "High": 1.35}.get(req.complexity, 1.0)
        smult = {"Luxury": 1.4, "Whimsical": 1.2, "Romantic": 1.1, "Modern": 1.0,
                 "Rustic": 0.85, "Minimalist": 0.75}.get(req.style, 1.0)
        pred = int(base * mult * smult * random.uniform(0.92, 1.08))
        return {"predicted_cost": pred, "range": [int(pred * 0.8), int(pred * 1.2)],
                "confidence": 0.74, "similar_items": [], "source": "Rule-based"}


@router.get("/")
def get_status():
    try:
        from ml.decor_model import get_predictor
        p = get_predictor()
        method = "ml" if p.model_mid else "rule-based"
        samples = p.n_samples
    except Exception:
        method, samples = "rule-based", 0
    return {"module": "Decor AI", "status": "ready", "method": method, "n_samples": samples}
