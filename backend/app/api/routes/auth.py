from fastapi import APIRouter, Request, Response, status

from app.api.deps import SESSION_COOKIE, DbSession, OptionalUser, SessionCookie
from app.config import get_settings
from app.schemas.auth import AuthResponse, LoginRequest, SessionResponse, SignupRequest, UserResponse
from app.services import auth_service
from app.services.auth_service import SESSION_LIFETIME

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=int(SESSION_LIFETIME.total_seconds()),
        httponly=True,
        samesite="lax",
        secure=get_settings().is_production,
        path="/",
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, request: Request, response: Response, db: DbSession) -> AuthResponse:
    user, token = await auth_service.signup(
        db,
        email=payload.email,
        password=payload.password,
        name=payload.name,
        user_agent=request.headers.get("user-agent"),
    )
    _set_session_cookie(response, token)
    return AuthResponse(user=UserResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, request: Request, response: Response, db: DbSession) -> AuthResponse:
    user, token = await auth_service.login(
        db, email=payload.email, password=payload.password, user_agent=request.headers.get("user-agent")
    )
    _set_session_cookie(response, token)
    return AuthResponse(user=UserResponse.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response, db: DbSession, hf_session: SessionCookie = None) -> None:
    if hf_session:
        await auth_service.logout(db, hf_session)
    response.delete_cookie(SESSION_COOKIE, path="/")


@router.get("/me", response_model=SessionResponse)
async def me(user: OptionalUser) -> SessionResponse:
    return SessionResponse(user=UserResponse.model_validate(user) if user else None)
