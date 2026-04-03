from fastapi import APIRouter

router = APIRouter()

@router.get("/config")
def get_config():
    return {"status": "Wedding config module ready"}

@router.post("/save")
def save_config(data: dict):
    return {"status": "saved", "data": data}
