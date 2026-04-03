from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import sys, os, random
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

router = APIRouter()

DECOR_LIBRARY = [
    {"id":1,  "emoji":"🌸", "name":"Floral Arch Mandap",       "style":"Romantic",    "complexity":"High",   "base_cost":180000, "function_type":"Mandap"},
    {"id":2,  "emoji":"🕯", "name":"Candle Centerpieces",       "style":"Minimalist",  "complexity":"Low",    "base_cost":35000,  "function_type":"Table Decor"},
    {"id":3,  "emoji":"🌺", "name":"Marigold Garland Entrance", "style":"Traditional", "complexity":"Medium", "base_cost":45000,  "function_type":"Entrance"},
    {"id":4,  "emoji":"✨", "name":"LED Fairy Light Ceiling",   "style":"Modern",      "complexity":"High",   "base_cost":120000, "function_type":"Ceiling"},
    {"id":5,  "emoji":"🌿", "name":"Tropical Leaf Backdrop",    "style":"Boho",        "complexity":"Medium", "base_cost":65000,  "function_type":"Backdrop"},
    {"id":6,  "emoji":"🦋", "name":"Butterfly Garden Stage",    "style":"Whimsical",   "complexity":"High",   "base_cost":220000, "function_type":"Stage"},
    {"id":7,  "emoji":"🪔", "name":"Diya Pathway Lighting",     "style":"Traditional", "complexity":"Low",    "base_cost":22000,  "function_type":"Lighting"},
    {"id":8,  "emoji":"🌙", "name":"Moon Gate Photo Booth",     "style":"Modern",      "complexity":"Medium", "base_cost":55000,  "function_type":"Photo Booth"},
    {"id":9,  "emoji":"🌹", "name":"Rose Petal Aisle",          "style":"Romantic",    "complexity":"Low",    "base_cost":18000,  "function_type":"Aisle"},
    {"id":10, "emoji":"🏛", "name":"Royal Pillar Draping",      "style":"Luxury",      "complexity":"High",   "base_cost":280000, "function_type":"Pillars"},
    {"id":11, "emoji":"🌼", "name":"Sunflower Farm Table",      "style":"Rustic",      "complexity":"Medium", "base_cost":48000,  "function_type":"Table Decor"},
    {"id":12, "emoji":"🎊", "name":"Confetti Balloon Ceiling",  "style":"Playful",     "complexity":"Low",    "base_cost":28000,  "function_type":"Ceiling"},
]

class PredictRequest(BaseModel):
    function_type: str
    style: str
    complexity: str
    image_seed: Optional[int] = 42
    region: Optional[str] = "Pan-India"

@router.get("/library")
def get_library():
    items = []
    for d in DECOR_LIBRARY:
        mult = {"Low": 0.85, "Medium": 1.0, "High": 1.3}.get(d["complexity"], 1.0)
        pred = int(d["base_cost"] * mult)
        items.append({**d, "predicted_cost": pred, "cost_range": [int(pred*0.8), int(pred*1.2)]})
    return {"items": items, "count": len(items)}

@router.post("/predict")
def predict_decor_cost(req: PredictRequest):
    try:
        from ml.train import predict as ml_predict, find_similar
        result = ml_predict(req.function_type, req.style, req.complexity,
                            region=req.region, image_seed=req.image_seed)
        similar = find_similar(req.image_seed, top_k=3, function_type=req.function_type)
        return {"predicted_cost": result["predicted_cost"], "range": result["range"],
                "confidence": result["confidence"], "similar_items": similar, "source": "RandomForest ML"}
    except Exception:
        base_map = {"Mandap":180000,"Entrance":50000,"Table Decor":40000,"Ceiling":80000,
                    "Backdrop":60000,"Stage":200000,"Lighting":25000,"Photo Booth":55000,
                    "Aisle":20000,"Pillars":250000}
        base = base_map.get(req.function_type, 60000)
        mult = {"Low":0.75,"Medium":1.0,"High":1.35}.get(req.complexity,1.0)
        smult = {"Luxury":1.4,"Whimsical":1.2,"Romantic":1.1,"Modern":1.0,"Rustic":0.85,"Minimalist":0.75}.get(req.style,1.0)
        pred = int(base * mult * smult * random.uniform(0.92,1.08))
        return {"predicted_cost": pred, "range": [int(pred*0.8), int(pred*1.2)],
                "confidence": 0.74, "similar_items": random.sample(DECOR_LIBRARY,3), "source": "Rule-based"}

@router.get("/")
def get_status():
    return {"module": "Decor AI", "status": "ready", "library_size": len(DECOR_LIBRARY)}
