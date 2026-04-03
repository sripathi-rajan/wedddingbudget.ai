from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def get_food():
    return {"module": "food", "status": "ready"}
