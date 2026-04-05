from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import wedding_config, budget, decor, food, artists, logistics, sundries, admin
import uvicorn, os


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed data on startup
    from database import create_all as _create_all, AsyncSessionLocal
    from seed_data import seed as _seed
    await _create_all()
    await _seed()

    from ml.import_images import import_images as _import_images
    await _import_images()

    import logging

    # Load RL Budget Agent
    try:
        from ml.rl_agent import get_rl_agent
        agent = get_rl_agent()
        async with AsyncSessionLocal() as db:
            await agent.load_state(db)
        total_rl = sum(agent.training_counts.values())
        cats_rl  = sum(1 for c in agent.training_counts.values() if c > 0)
        logging.info(f"RL Agent loaded ({total_rl} training samples across {cats_rl} categories)")
    except Exception as exc:
        logging.warning(f"RL Agent init skipped: {exc}")

    # Load Decor ML model (non-fatal if not trained yet)
    try:
        from ml.decor_model import get_predictor
        p = get_predictor()
        if p.model_mid is not None:
            logging.info(f"Decor ML model loaded ({p.n_samples} samples)")
        else:
            logging.info("Decor ML using rule-based fallback")
    except Exception as exc:
        logging.warning(f"Decor ML init skipped: {exc}")

    yield


app = FastAPI(title="weddingbudget.AI - Wedding Planner API", version="1.0.0", lifespan=lifespan)

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

app.mount("/decor_images", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "decor_dataset", "data", "images")), name="decor")


@app.get("/")
def root():
    return {"message": "weddingbudget.AI Backend Running!", "docs": "/docs", "version": "1.0.0"}

@app.get("/health")
def health():
    rl_info = {}
    try:
        from ml.rl_agent import get_rl_agent
        agent = get_rl_agent()
        rl_info = {
            "rl_agent_loaded":  True,
            "rl_total_samples": sum(agent.training_counts.values()),
        }
    except Exception:
        rl_info = {"rl_agent_loaded": False, "rl_total_samples": 0}

    decor_info = {}
    try:
        from ml.decor_model import get_predictor
        p = get_predictor()
        decor_info = {
            "decor_model_loaded":  p.model_mid is not None,
            "decor_model_samples": p.n_samples,
        }
    except Exception:
        decor_info = {"decor_model_loaded": False, "decor_model_samples": 0}

    return {"status": "ok", **rl_info, **decor_info}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
