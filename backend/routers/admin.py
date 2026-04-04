"""Admin router — JWT-protected cost database management (SQLAlchemy)."""
import json
import os
import csv
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from auth import authenticate_admin, create_access_token, require_admin
from database import get_db
from models import Artist, FBRate, LogisticsCost, AdminSetting, CostVersion, DecorImage

router = APIRouter()

# ── Decor image/label paths (file-based, unchanged) ───────────────────────────
_BASE = os.path.dirname(os.path.dirname(__file__))
IMAGES_DIR = os.path.join(_BASE, "decor_dataset", "data", "images")
LABELS_CSV  = os.path.join(_BASE, "decor_dataset", "data", "labels.csv")


# ── CSV helpers (decor labels) ─────────────────────────────────────────────────
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
    fieldnames = ["filename", "function_type", "style", "complexity", "seed_cost"]
    with open(LABELS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in labels.values():
            writer.writerow({k: row.get(k, "") for k in fieldnames})


# ── Pydantic models ────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class ArtistIn(BaseModel):
    name: str
    type: str
    min_fee: int
    max_fee: int
    city: Optional[str] = None


class FBRates(BaseModel):
    veg: dict
    non_veg: dict
    jain: dict


class LogisticsCity(BaseModel):
    city: str
    ghodi: int
    dholi: int
    transfer_per_trip: int


class ContingencySettings(BaseModel):
    contingency_pct: float
    weekend_surcharge_pct: float


class DecorLabel(BaseModel):
    filename: str
    function_type: str
    style: str
    complexity: int   # 1–5
    seed_cost: float


# ── Auth endpoint (public) ─────────────────────────────────────────────────────
@router.post("/login")
def login(body: LoginRequest):
    if not authenticate_admin(body.username, body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": body.username})
    return {"access_token": token, "token_type": "bearer", "expires_in_hours": 24}


# ── Unprotected status ─────────────────────────────────────────────────────────
@router.get("/")
def get_admin():
    return {"module": "admin", "status": "ready", "version": "3.0.0"}


@router.get("/stats")
def get_stats():
    return {
        "app": "weddingbudget.ai",
        "version": "3.0.0",
        "backend": "FastAPI + SQLAlchemy",
        "auth": "JWT (24h)",
    }


# ── Artists ────────────────────────────────────────────────────────────────────
@router.get("/artists", dependencies=[Depends(require_admin)])
async def get_artists(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Artist).order_by(Artist.id))).scalars().all()
    return [{"id": r.id, "name": r.name, "type": r.type,
             "min_fee": r.min_fee, "max_fee": r.max_fee, "city": r.city} for r in rows]


@router.post("/artists", dependencies=[Depends(require_admin)])
async def add_artist(artist: ArtistIn, db: AsyncSession = Depends(get_db)):
    row = Artist(**artist.model_dump())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return {"id": row.id, "name": row.name, "type": row.type,
            "min_fee": row.min_fee, "max_fee": row.max_fee, "city": row.city}


@router.put("/artists/{artist_id}", dependencies=[Depends(require_admin)])
async def update_artist(artist_id: int, artist: ArtistIn, db: AsyncSession = Depends(get_db)):
    row = await db.get(Artist, artist_id)
    if not row:
        raise HTTPException(status_code=404, detail="Artist not found")
    # version snapshot
    db.add(CostVersion(
        table_name="artists", record_id=artist_id,
        old_value=json.dumps({"name": row.name, "type": row.type,
                               "min_fee": row.min_fee, "max_fee": row.max_fee}),
        new_value=json.dumps(artist.model_dump()),
    ))
    for k, v in artist.model_dump().items():
        setattr(row, k, v)
    await db.commit()
    await db.refresh(row)
    return {"id": row.id, "name": row.name, "type": row.type,
            "min_fee": row.min_fee, "max_fee": row.max_fee, "city": row.city}


@router.delete("/artists/{artist_id}", dependencies=[Depends(require_admin)])
async def delete_artist(artist_id: int, db: AsyncSession = Depends(get_db)):
    row = await db.get(Artist, artist_id)
    if not row:
        raise HTTPException(status_code=404, detail="Artist not found")
    await db.delete(row)
    await db.commit()
    return {"ok": True}


# ── F&B Rates ──────────────────────────────────────────────────────────────────
@router.get("/fb-rates", dependencies=[Depends(require_admin)])
async def get_fb_rates(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(FBRate))).scalars().all()
    # Reconstruct nested dict: {meal_type: {tier: {occasion: cost}}}
    result: dict = {}
    for r in rows:
        result.setdefault(r.meal_type, {}).setdefault(r.tier, {})[r.occasion] = r.per_head_cost
    return result


@router.put("/fb-rates", dependencies=[Depends(require_admin)])
async def update_fb_rates(rates: FBRates, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(FBRate))
    for meal_type, tiers in rates.model_dump().items():
        for tier, occasions in tiers.items():
            for occasion, cost in occasions.items():
                db.add(FBRate(meal_type=meal_type, tier=tier, occasion=occasion, per_head_cost=cost))
    await db.commit()
    return rates


# ── Logistics ──────────────────────────────────────────────────────────────────
@router.get("/logistics", dependencies=[Depends(require_admin)])
async def get_logistics(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(LogisticsCost))).scalars().all()
    result: dict = {}
    for r in rows:
        result.setdefault(r.city, {})[r.service_type] = r.unit_cost
    return result


@router.put("/logistics/{city}", dependencies=[Depends(require_admin)])
async def update_logistics_city(city: str, data: LogisticsCity, db: AsyncSession = Depends(get_db)):
    for svc, cost in [("ghodi", data.ghodi), ("dholi", data.dholi),
                      ("transfer_per_trip", data.transfer_per_trip)]:
        result = await db.execute(
            select(LogisticsCost).where(LogisticsCost.city == city, LogisticsCost.service_type == svc)
        )
        row = result.scalar_one_or_none()
        if row:
            row.unit_cost = cost
        else:
            db.add(LogisticsCost(city=city, service_type=svc, unit_cost=cost, unit="per_event"))
    await db.commit()
    return {"ghodi": data.ghodi, "dholi": data.dholi, "transfer_per_trip": data.transfer_per_trip}


@router.post("/logistics", dependencies=[Depends(require_admin)])
async def add_logistics_city(data: LogisticsCity, db: AsyncSession = Depends(get_db)):
    for svc, cost in [("ghodi", data.ghodi), ("dholi", data.dholi),
                      ("transfer_per_trip", data.transfer_per_trip)]:
        db.add(LogisticsCost(city=data.city, service_type=svc, unit_cost=cost, unit="per_event"))
    await db.commit()
    return {data.city: {"ghodi": data.ghodi, "dholi": data.dholi,
                        "transfer_per_trip": data.transfer_per_trip}}


# ── Contingency (stored in admin_settings) ─────────────────────────────────────
@router.get("/contingency", dependencies=[Depends(require_admin)])
async def get_contingency(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(AdminSetting).where(AdminSetting.key.in_(["contingency_pct", "weekend_surcharge_pct"]))
    )).scalars().all()
    data = {r.key: float(r.value) for r in rows}
    return {
        "contingency_pct": data.get("contingency_pct", 0.08),
        "weekend_surcharge_pct": data.get("weekend_surcharge_pct", 0.15),
    }


@router.put("/contingency", dependencies=[Depends(require_admin)])
async def update_contingency(data: ContingencySettings, db: AsyncSession = Depends(get_db)):
    for key, value in [("contingency_pct", data.contingency_pct),
                       ("weekend_surcharge_pct", data.weekend_surcharge_pct)]:
        result = await db.execute(select(AdminSetting).where(AdminSetting.key == key))
        row = result.scalar_one_or_none()
        if row:
            row.value = str(value)
        else:
            db.add(AdminSetting(key=key, value=str(value)))
    await db.commit()
    return {**data.model_dump(), "updated_at": datetime.utcnow().isoformat() + "Z"}


# ── Decor Images ───────────────────────────────────────────────────────────────
@router.get("/decor-images", dependencies=[Depends(require_admin)])
def list_decor_images():
    labels = _read_labels()
    images = []
    if os.path.isdir(IMAGES_DIR):
        for fname in sorted(os.listdir(IMAGES_DIR)):
            if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                label = labels.get(fname, {})
                images.append({
                    "filename": fname,
                    "function_type": label.get("function_type", ""),
                    "style":         label.get("style", ""),
                    "complexity":    int(label["complexity"]) if label.get("complexity") else None,
                    "seed_cost":     float(label["seed_cost"]) if label.get("seed_cost") else None,
                })
    return {"images": images, "total": len(images)}


@router.post("/decor-images/label", dependencies=[Depends(require_admin)])
def label_decor_image(body: DecorLabel):
    labels = _read_labels()
    labels[body.filename] = {
        "filename":      body.filename,
        "function_type": body.function_type,
        "style":         body.style,
        "complexity":    str(body.complexity),
        "seed_cost":     str(body.seed_cost),
    }
    _write_labels(labels)
    return {"ok": True, "filename": body.filename}
