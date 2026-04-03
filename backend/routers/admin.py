from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os, sys, csv

router = APIRouter()

IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "decor_dataset", "data", "images")
LABELS_CSV = os.path.join(os.path.dirname(__file__), "..", "decor_dataset", "data", "labels.csv")


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
    fieldnames = ["filename", "category", "complexity", "cost"]
    with open(LABELS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in labels.values():
            writer.writerow({k: row.get(k, "") for k in fieldnames})


class LabelUpdate(BaseModel):
    filename: str
    category: str
    complexity: str
    cost: float

COST_TABLES = {
    "wedding_type_base": {
        "Hindu":     {"low": 800000,  "mid": 2500000, "high": 8000000},
        "Islam":     {"low": 600000,  "mid": 1800000, "high": 5000000},
        "Sikh":      {"low": 700000,  "mid": 2000000, "high": 6000000},
        "Christian": {"low": 500000,  "mid": 1500000, "high": 4000000},
        "Buddhist":  {"low": 400000,  "mid": 1200000, "high": 3500000},
        "Jain":      {"low": 600000,  "mid": 1800000, "high": 5000000},
        "Generic":   {"low": 400000,  "mid": 1500000, "high": 4500000},
    },
    "event_costs": {
        "Engagement":              {"low": 50000,  "mid": 150000,  "high": 500000},
        "Haldi":                   {"low": 20000,  "mid": 60000,   "high": 200000},
        "Mehendi":                 {"low": 30000,  "mid": 100000,  "high": 350000},
        "Sangeet":                 {"low": 100000, "mid": 350000,  "high": 1200000},
        "Pre Wedding Cocktail":    {"low": 80000,  "mid": 250000,  "high": 900000},
        "Wedding Day Ceremony":    {"low": 200000, "mid": 600000,  "high": 2000000},
        "Reception":               {"low": 150000, "mid": 500000,  "high": 1800000},
    },
    "venue_costs_per_day": {
        "Banquet Hall":            {"low": 50000,  "mid": 150000,  "high": 500000},
        "Wedding Lawn":            {"low": 40000,  "mid": 120000,  "high": 400000},
        "Hotel 3-5 Star":          {"low": 100000, "mid": 350000,  "high": 1200000},
        "Resort":                  {"low": 150000, "mid": 500000,  "high": 2000000},
        "Heritage Palace":         {"low": 300000, "mid": 1000000, "high": 5000000},
        "Beach Venue":             {"low": 200000, "mid": 600000,  "high": 2500000},
        "Farmhouse":               {"low": 50000,  "mid": 150000,  "high": 500000},
        "Temple":                  {"low": 10000,  "mid": 40000,   "high": 150000},
        "Home Intimate":           {"low": 10000,  "mid": 30000,   "high": 100000},
    },
    "artist_costs": {
        "Local DJ":              {"low": 50000,   "high": 150000},
        "Professional DJ":       {"low": 200000,  "high": 500000},
        "Bollywood Singer A":    {"low": 800000,  "high": 1200000},
        "Bollywood Singer B":    {"low": 500000,  "high": 900000},
        "Live Band (Local)":     {"low": 100000,  "high": 300000},
        "Live Band (National)":  {"low": 500000,  "high": 1500000},
        "Folk Artist":           {"low": 30000,   "high": 100000},
        "Myra Entertainment":    {"low": 200000,  "high": 600000},
        "Choreographer":         {"low": 50000,   "high": 200000},
        "Anchor / Emcee":        {"low": 30000,   "high": 150000},
    },
    "decor_rates": {
        "Mandap":      {"low": 150000, "mid": 200000, "high": 400000},
        "Stage":       {"low": 150000, "mid": 250000, "high": 450000},
        "Pillars":     {"low": 100000, "mid": 200000, "high": 350000},
        "Ceiling":     {"low": 60000,  "mid": 100000, "high": 200000},
        "Backdrop":    {"low": 40000,  "mid": 70000,  "high": 150000},
        "Entrance":    {"low": 30000,  "mid": 55000,  "high": 120000},
        "Photo Booth": {"low": 25000,  "mid": 60000,  "high": 120000},
        "Table Decor": {"low": 20000,  "mid": 45000,  "high": 90000},
        "Lighting":    {"low": 15000,  "mid": 30000,  "high": 70000},
        "Aisle":       {"low": 10000,  "mid": 22000,  "high": 50000},
    },
    "style_multipliers": {
        "Luxury":      1.45,
        "Whimsical":   1.25,
        "Romantic":    1.15,
        "Modern":      1.05,
        "Traditional": 0.95,
        "Rustic":      0.88,
        "Boho":        0.90,
        "Minimalist":  0.72,
        "Playful":     0.80,
    },
    "complexity_multipliers": {
        "High":   1.40,
        "Medium": 1.00,
        "Low":    0.75,
    },
    "logistics": {
        "innova_per_trip":     3500,
        "guests_per_vehicle":  3,
        "trips_per_vehicle":   4,
        "dholi_per_hour":      5000,
        "sfx_cold_pyro":       15000,
        "sfx_confetti_cannon": 8000,
        "sfx_smoke_machine":   5000,
        "sfx_laser_show":      25000,
        "weekend_surcharge":   0.15,
        "contingency_pct":     0.08,
    }
}


@router.get("/")
def get_admin():
    return {"module": "admin", "status": "ready", "version": "2.0.0"}


@router.get("/stats")
def get_stats():
    model_exists = os.path.exists("decor_model.joblib")
    encoder_exists = os.path.exists("decor_encoder.joblib")
    return {
        "app": "weddingbudget.ai",
        "version": "2.0.0",
        "backend": "FastAPI",
        "ml_model_loaded": model_exists,
        "ml_encoder_loaded": encoder_exists,
        "cost_table_categories": list(COST_TABLES.keys()),
        "weekend_surcharge": "15%",
        "contingency_rate": "8%",
    }


@router.get("/cost-tables")
def get_cost_tables():
    return COST_TABLES


@router.get("/cost-tables/{table_name}")
def get_cost_table(table_name: str):
    if table_name not in COST_TABLES:
        return {"error": f"Table '{table_name}' not found", "available": list(COST_TABLES.keys())}
    return {table_name: COST_TABLES[table_name]}


@router.get("/ml/status")
def get_ml_status():
    model_path = "decor_model.joblib"
    encoder_path = "decor_encoder.joblib"
    embeddings_path = "embeddings.json"
    return {
        "model_file": model_path,
        "model_exists": os.path.exists(model_path),
        "encoder_exists": os.path.exists(encoder_path),
        "embeddings_exists": os.path.exists(embeddings_path),
        "algorithm": "RandomForestRegressor (300 estimators)",
        "features": "128-dim embedding + one-hot (function_type, style, complexity, region)",
        "base_samples": 75,
        "augmented_samples": 400,
        "mae_estimate": "~₹15,000–20,000 (augmented synthetic data)",
        "confidence_range": "80-95%",
    }


@router.get("/images")
def list_images():
    labels = _read_labels()
    images = []
    if os.path.isdir(IMAGES_DIR):
        for fname in sorted(os.listdir(IMAGES_DIR)):
            if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                label = labels.get(fname, {})
                images.append({
                    "filename": fname,
                    "category": label.get("category", ""),
                    "complexity": label.get("complexity", ""),
                    "cost": float(label["cost"]) if label.get("cost") else None,
                })
    return {"images": images}


@router.post("/label")
def update_label(body: LabelUpdate):
    labels = _read_labels()
    labels[body.filename] = {
        "filename": body.filename,
        "category": body.category,
        "complexity": body.complexity,
        "cost": str(body.cost),
    }
    _write_labels(labels)
    return {"ok": True, "filename": body.filename}


@router.get("/decor/rates")
def get_decor_rates():
    return {
        "function_type_base_rates": COST_TABLES["decor_rates"],
        "style_multipliers": COST_TABLES["style_multipliers"],
        "complexity_multipliers": COST_TABLES["complexity_multipliers"],
        "note": "Final cost = base_rate × style_mult × complexity_mult",
    }
