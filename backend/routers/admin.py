"""Admin router — JWT-protected cost database management."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import os, csv, json
from datetime import datetime

from auth import authenticate_admin, create_access_token, require_admin

router = APIRouter()

# ── Paths ──────────────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.dirname(__file__))
DATA_DIR      = os.path.join(_BASE, "data")
ARTISTS_FILE  = os.path.join(DATA_DIR, "artists.json")
FB_FILE       = os.path.join(DATA_DIR, "fb_rates.json")
LOGISTICS_FILE= os.path.join(DATA_DIR, "logistics.json")
CONTINGENCY_FILE = os.path.join(DATA_DIR, "contingency.json")
IMAGES_DIR    = os.path.join(_BASE, "decor_dataset", "data", "images")
LABELS_CSV    = os.path.join(_BASE, "decor_dataset", "data", "labels.csv")

os.makedirs(DATA_DIR, exist_ok=True)


# ── JSON helpers ───────────────────────────────────────────────────────────────
def _read_json(path: str, default):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: str, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


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


class Artist(BaseModel):
    id: Optional[int] = None
    name: str
    type: str
    min_fee: int
    max_fee: int


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
        "backend": "FastAPI",
        "auth": "JWT (24h)",
    }


# ── Artists ────────────────────────────────────────────────────────────────────
@router.get("/artists", dependencies=[Depends(require_admin)])
def get_artists():
    return _read_json(ARTISTS_FILE, [])


@router.post("/artists", dependencies=[Depends(require_admin)])
def add_artist(artist: Artist):
    artists = _read_json(ARTISTS_FILE, [])
    new_id = max((a["id"] for a in artists), default=0) + 1
    artist.id = new_id
    artists.append(artist.dict())
    _write_json(ARTISTS_FILE, artists)
    return artist


@router.put("/artists/{artist_id}", dependencies=[Depends(require_admin)])
def update_artist(artist_id: int, artist: Artist):
    artists = _read_json(ARTISTS_FILE, [])
    for i, a in enumerate(artists):
        if a["id"] == artist_id:
            artists[i] = {**artist.dict(), "id": artist_id}
            _write_json(ARTISTS_FILE, artists)
            return artists[i]
    raise HTTPException(status_code=404, detail="Artist not found")


@router.delete("/artists/{artist_id}", dependencies=[Depends(require_admin)])
def delete_artist(artist_id: int):
    artists = _read_json(ARTISTS_FILE, [])
    new_list = [a for a in artists if a["id"] != artist_id]
    if len(new_list) == len(artists):
        raise HTTPException(status_code=404, detail="Artist not found")
    _write_json(ARTISTS_FILE, new_list)
    return {"ok": True}


# ── F&B Rates ──────────────────────────────────────────────────────────────────
@router.get("/fb-rates", dependencies=[Depends(require_admin)])
def get_fb_rates():
    return _read_json(FB_FILE, {})


@router.put("/fb-rates", dependencies=[Depends(require_admin)])
def update_fb_rates(rates: FBRates):
    _write_json(FB_FILE, rates.dict())
    return rates


# ── Logistics ──────────────────────────────────────────────────────────────────
@router.get("/logistics", dependencies=[Depends(require_admin)])
def get_logistics():
    return _read_json(LOGISTICS_FILE, {})


@router.put("/logistics/{city}", dependencies=[Depends(require_admin)])
def update_logistics_city(city: str, data: LogisticsCity):
    logistics = _read_json(LOGISTICS_FILE, {})
    logistics[city] = {"ghodi": data.ghodi, "dholi": data.dholi, "transfer_per_trip": data.transfer_per_trip}
    _write_json(LOGISTICS_FILE, logistics)
    return logistics[city]


@router.post("/logistics", dependencies=[Depends(require_admin)])
def add_logistics_city(data: LogisticsCity):
    logistics = _read_json(LOGISTICS_FILE, {})
    logistics[data.city] = {"ghodi": data.ghodi, "dholi": data.dholi, "transfer_per_trip": data.transfer_per_trip}
    _write_json(LOGISTICS_FILE, logistics)
    return {data.city: logistics[data.city]}


# ── Contingency ────────────────────────────────────────────────────────────────
@router.get("/contingency", dependencies=[Depends(require_admin)])
def get_contingency():
    return _read_json(CONTINGENCY_FILE, {"contingency_pct": 0.08, "weekend_surcharge_pct": 0.15})


@router.put("/contingency", dependencies=[Depends(require_admin)])
def update_contingency(data: ContingencySettings):
    payload = {**data.dict(), "updated_at": datetime.utcnow().isoformat() + "Z"}
    _write_json(CONTINGENCY_FILE, payload)
    return payload


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
