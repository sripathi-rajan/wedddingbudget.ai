from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def get_logistics():
    return {"module": "logistics", "status": "ready"}
