"""FastAPI dependencies shared across routes (database session, authenticated user)."""

from typing import Annotated

from fastapi import Cookie, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UnauthorizedError
from app.db.session import get_db
from app.models import User
from app.services import auth_service
from app.services.runtime import GenerationRuntime

SESSION_COOKIE = "hf_session"

DbSession = Annotated[AsyncSession, Depends(get_db)]
SessionCookie = Annotated[str | None, Cookie(alias=SESSION_COOKIE)]


async def get_optional_user(db: DbSession, hf_session: SessionCookie = None) -> User | None:
    if not hf_session:
        return None
    return await auth_service.get_user_by_session_token(db, hf_session)


async def get_current_user(user: Annotated[User | None, Depends(get_optional_user)]) -> User:
    if user is None:
        raise UnauthorizedError("Authentication required.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


def get_runtime(request: Request) -> GenerationRuntime:
    runtime: GenerationRuntime = request.app.state.runtime
    return runtime


Runtime = Annotated[GenerationRuntime, Depends(get_runtime)]
