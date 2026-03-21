from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import wedding_config, budget, decor, food, artists, logistics, sundries, admin
import uvicorn, os

app = FastAPI(title="weddingbudget.AI - Wedding Planner API", version="1.0.0")

# Allow any origin — Vercel frontend calls this Render backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wedding_config.router, prefix="/api/wedding",   tags=["Wedding Config"])
app.include_router(budget.router,         prefix="/api/budget",    tags=["Budget Engine"])
app.include_router(decor.router,          prefix="/api/decor",     tags=["Decor AI"])
app.include_router(food.router,           prefix="/api/food",      tags=["Food & Beverages"])
app.include_router(artists.router,        prefix="/api/artists",   tags=["Artists"])
app.include_router(logistics.router,      prefix="/api/logistics", tags=["Logistics"])
app.include_router(sundries.router,       prefix="/api/sundries",  tags=["Sundries"])
app.include_router(admin.router,          prefix="/api/admin",     tags=["Admin"])

@app.get("/")
def root():
    return {"message": "weddingbudget.AI Backend Running!", "docs": "/docs", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
