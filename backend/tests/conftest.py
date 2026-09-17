"""Integration tests run against a real Postgres database (`higgsfield_test` by default).

The fixture creates the database if needed, applies Alembic migrations, and truncates
all tables between tests so each test starts from a clean state.
"""

import asyncio
import os
from collections.abc import AsyncIterator

import pytest
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import command

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+asyncpg://postgres@localhost:5432/higgsfield_test"
)
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from app.api.deps import CurrentUser  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.core.ratelimit import generation_limiter  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import dispose_engine  # noqa: E402
from app.main import create_app  # noqa: E402
from app.providers.fake_audio import FakeAudioProvider  # noqa: E402
from app.providers.fake_image import FakeImageProvider  # noqa: E402
from app.providers.fake_video import FakeVideoProvider  # noqa: E402
from app.services.runtime import GenerationRuntime  # noqa: E402
from app.storage.fake_storage import FakeStorage  # noqa: E402


async def _ensure_database_exists() -> None:
    admin_url = TEST_DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
    db_name = TEST_DATABASE_URL.rsplit("/", 1)[1]
    engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")
    async with engine.connect() as conn:
        exists = await conn.execute(text("select 1 from pg_database where datname = :n"), {"n": db_name})
        if exists.scalar_one_or_none() is None:
            await conn.execute(text(f'create database "{db_name}"'))
    await engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def migrated_database() -> None:
    # Synchronous on purpose: Alembic's async env uses asyncio.run(), which cannot
    # be nested inside a running event loop.
    asyncio.run(_ensure_database_exists())
    config = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    command.upgrade(config, "head")


@pytest.fixture(autouse=True)
async def clean_tables() -> AsyncIterator[None]:
    yield
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        tables = ", ".join(f'"{t.name}"' for t in reversed(Base.metadata.sorted_tables))
        await conn.execute(text(f"truncate table {tables} cascade"))
    await engine.dispose()


@pytest.fixture
def runtime() -> GenerationRuntime:
    """Fake provider + storage; tests tweak `runtime.image_provider` / `runtime.storage` as needed."""
    return GenerationRuntime(
        image_provider=FakeImageProvider(),
        storage=FakeStorage(serve_locally=False),
        video_provider=FakeVideoProvider(),
        audio_providers={"cloudflare": FakeAudioProvider(), "gemini": FakeAudioProvider()},
    )


@pytest.fixture
def app(runtime: GenerationRuntime) -> FastAPI:
    """The application under test; tests may swap `app.state.google_oauth` etc. before requests."""
    get_settings.cache_clear()
    generation_limiter.reset()
    app = create_app()
    app.state.runtime = runtime

    @app.get("/api/_test/protected")
    async def protected(user: CurrentUser) -> dict[str, str]:
        """Exercises the CurrentUser dependency without depending on a product endpoint."""
        return {"email": user.email}

    return app


@pytest.fixture
async def client(app: FastAPI, runtime: GenerationRuntime) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    await runtime.wait_idle()
    await dispose_engine()
