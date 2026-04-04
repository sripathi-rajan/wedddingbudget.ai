"""JWT authentication utilities for Admin Panel."""
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

# ── Config ─────────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ.get("ADMIN_JWT_SECRET", "shaadi-secret-jwt-key-2026-!@#$%")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
# Store hashed password; default plain: shaadi@admin2026
_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
_DEFAULT_HASH = _pwd_ctx.hash("shaadi@admin2026")
ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", _DEFAULT_HASH)

bearer_scheme = HTTPBearer()


# ── Token helpers ──────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)


def authenticate_admin(username: str, password: str) -> bool:
    return username == ADMIN_USERNAME and verify_password(password, ADMIN_PASSWORD_HASH)


# ── FastAPI dependency ─────────────────────────────────────────────────────────
def require_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username != ADMIN_USERNAME:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username
