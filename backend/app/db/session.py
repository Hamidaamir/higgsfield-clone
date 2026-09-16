from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine | None:
    """Lazily build the engine so the app can boot (and report) without a database."""
    global _engine, _session_factory
    settings = get_settings()
    if _engine is None and settings.database_url:
        # Neon scales to zero; pre_ping transparently re-opens stale pooled connections.
        _engine = create_async_engine(settings.database_url, pool_pre_ping=True, pool_size=5, max_overflow=5)
        _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    if get_engine() is None or _session_factory is None:
        from app.core.errors import ServiceUnavailableError

        raise ServiceUnavailableError("Database is not configured.")
    return _session_factory


async def get_db() -> AsyncIterator[AsyncSession]:
    async with get_session_factory()() as session:
        yield session


async def dispose_engine() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
