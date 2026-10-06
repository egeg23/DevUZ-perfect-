"""SUNSCRYPT API. Все пути — под /api: gateway отдаёт /api сюда, остальное —
сайту."""

from typing import Annotated

from fastapi import Depends, FastAPI, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app import safety
from app.cache import redis_alive
from app.config import get_settings
from app.db import db_alive, get_session, read_flags

app = FastAPI(title="SUNSCRYPT API", docs_url="/api/docs", openapi_url="/api/openapi.json")


async def get_flags(session: Annotated[AsyncSession, Depends(get_session)]) -> dict[str, bool]:
    return await read_flags(session)


@app.get("/api/health")
async def health(response: Response) -> dict:
    db, cache = await db_alive(), await redis_alive()
    ok = db and cache
    if not ok:
        response.status_code = 503
    return {
        "status": "ok" if ok else "degraded",
        "db": db,
        "redis": cache,
        "commit": get_settings().git_commit,
    }


@app.get("/api/status")
async def status(flags: Annotated[dict[str, bool], Depends(get_flags)]) -> dict:
    """Публичный режим сервиса: что разрешено прямо сейчас."""
    real_enabled = flags.get("real_trading_enabled", False)
    global_stop = flags.get("global_stop", False)
    return {
        "default_mode": safety.DEFAULT_MODE,
        "real_trading_allowed": safety.real_mode_allowed(real_enabled, global_stop),
        "global_stop": global_stop,
        "max_leverage": safety.MAX_LEVERAGE,
        "default_leverage": safety.DEFAULT_LEVERAGE,
    }
