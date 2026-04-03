from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def get_sundries():
    return {"module": "sundries", "status": "ready"}
