import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.router import api_router
from app.api.routes import dev_assets
from app.config import APP_VERSION, get_settings
from app.core.errors import register_error_handlers
from app.core.logging import configure_logging
from app.db.session import dispose_engine, get_engine, get_session_factory
from app.services.google_oauth import build_google_oauth
from app.services.job_runner import reconcile_interrupted
from app.services.runtime import GenerationRuntime, build_runtime

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    settings = get_settings()
    log.info("Starting API v%s (%s)", APP_VERSION, settings.app_env)
    if not isinstance(getattr(app.state, "runtime", None), GenerationRuntime):
        app.state.runtime = build_runtime(settings)
    if get_engine() is not None:
        try:
            async with get_session_factory()() as db:
                await reconcile_interrupted(db)
        except Exception:  # never block startup on reconciliation
            log.exception("startup reconciliation failed")
    yield
    await app.state.runtime.wait_idle()
    await dispose_engine()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Higgsfield Clone API",
        version=APP_VERSION,
        lifespan=lifespan,
        docs_url="/api/docs" if not settings.is_production else None,
        redoc_url=None,
        openapi_url="/api/openapi.json" if not settings.is_production else None,
    )
    # The browser normally reaches us through the Next.js same-origin rewrite; CORS
    # is configured explicitly for direct/local access only.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "PATCH"],
        allow_headers=["Content-Type", "Authorization"],
    )
    # Signed, short-lived cookie holding only the OAuth transaction (state, nonce, next). The
    # application session itself stays the opaque `hf_session` token stored in Postgres.
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret.get_secret_value(),
        session_cookie="hf_oauth",
        max_age=10 * 60,
        same_site="lax",
        https_only=settings.is_production,
        path="/api/auth",
    )
    app.state.google_oauth = build_google_oauth(settings)
    register_error_handlers(app)
    app.include_router(api_router)
    if settings.use_fake_providers:
        app.include_router(dev_assets.router, prefix="/api")
    return app


app = create_app()
