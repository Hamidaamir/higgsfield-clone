import logging
from typing import Literal

from fastapi import APIRouter
from sqlalchemy import text

from app.config import APP_VERSION
from app.db.session import get_engine
from app.schemas.common import HealthResponse

log = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    engine = get_engine()
    database: Literal["ok", "unavailable"] = "unavailable"
    if engine is not None:
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            database = "ok"
        except Exception as exc:  # health must never raise
            log.warning("Database health check failed: %s", type(exc).__name__)
    return HealthResponse(status="ok", version=APP_VERSION, database=database)
