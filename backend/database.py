"""SQLAlchemy async database engine.

Uses PostgreSQL when DATABASE_URL is set (production on Render),
falls back to SQLite for local development.
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# ── Engine setup ───────────────────────────────────────────────────────────────
_DATABASE_URL = os.environ.get("DATABASE_URL")

if _DATABASE_URL:
    # Render sets DATABASE_URL as postgres://...; SQLAlchemy needs postgresql+asyncpg://
    if _DATABASE_URL.startswith("postgres://"):
        _DATABASE_URL = _DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif _DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in _DATABASE_URL:
        _DATABASE_URL = _DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(_DATABASE_URL, pool_pre_ping=True)
else:
    _SQLITE_PATH = os.path.join(os.path.dirname(__file__), "data", "wedding.db")
    os.makedirs(os.path.dirname(_SQLITE_PATH), exist_ok=True)
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{_SQLITE_PATH}",
        connect_args={"check_same_thread": False},
    )

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


# ── Base class ─────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── FastAPI dependency ─────────────────────────────────────────────────────────
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def create_all():
    """Create all tables (run on startup)."""
    from models import Base as _Base  # noqa: F401 — registers all models
    async with engine.begin() as conn:
        await conn.run_sync(_Base.metadata.create_all)
