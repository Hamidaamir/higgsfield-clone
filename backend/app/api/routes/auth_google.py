"""Google sign-in endpoints. The browser reaches these through the Next.js `/api/*` rewrite, so
the OAuth redirect URI is on the frontend origin: `{PUBLIC_APP_URL}/api/auth/google/callback`."""

import html
import logging
from urllib.parse import urlencode

from fastapi import APIRouter, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse

from app.api.deps import DbSession
from app.api.routes.auth import set_session_cookie
from app.config import get_settings
from app.core.errors import NotFoundError, ServiceUnavailableError
from app.services import auth_service
from app.services.google_oauth import (
    SESSION_NEXT_KEY,
    FakeGoogleOAuth,
    GoogleOAuth,
    GoogleSignInError,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/google", tags=["auth"])

DEFAULT_NEXT = "/generate/image"
CALLBACK_PATH = "/api/auth/google/callback"


def safe_next_path(value: str | None) -> str:
    """Only same-origin absolute paths survive the round trip: no scheme, host, or `//host` tricks."""
    if not value or not value.startswith("/") or value.startswith("//") or "\\" in value:
        return DEFAULT_NEXT
    if any(ch in value for ch in ("\r", "\n")):
        return DEFAULT_NEXT
    return value


def _provider(request: Request) -> GoogleOAuth:
    provider: GoogleOAuth | None = getattr(request.app.state, "google_oauth", None)
    if provider is None:
        raise ServiceUnavailableError("Google sign-in is not configured on this deployment.")
    return provider


def _app_url(path: str) -> str:
    return get_settings().public_app_url.rstrip("/") + path


def _login_with_error(code: str) -> RedirectResponse:
    return RedirectResponse(_app_url(f"/login?{urlencode({'error': code})}"), status_code=302)


@router.get("/start", include_in_schema=False)
async def google_start(request: Request, next: str | None = Query(default=None)) -> RedirectResponse:
    """Begin the authorization-code flow; `next` (validated) is remembered for the callback."""
    provider = _provider(request)
    request.session[SESSION_NEXT_KEY] = safe_next_path(next)
    return await provider.authorize_redirect(request, _app_url(CALLBACK_PATH))


@router.get("/callback", include_in_schema=False)
async def google_callback(request: Request, db: DbSession) -> RedirectResponse:
    """Finish the flow, create/link the local user, open the normal session cookie, and return
    the browser to the page it wanted. Failures land on /login with a short error code."""
    provider = _provider(request)
    next_path = safe_next_path(request.session.pop(SESSION_NEXT_KEY, None))
    try:
        identity = await provider.complete(request)
        _user, token = await auth_service.login_with_google(
            db, identity, user_agent=request.headers.get("user-agent")
        )
    except GoogleSignInError as exc:
        log.info("google sign-in rejected: %s", exc)
        code = "google_unverified" if "verified" in str(exc) else "google"
        return _login_with_error(code)
    response = RedirectResponse(_app_url(next_path), status_code=302)
    set_session_cookie(response, token)
    return response


@router.get("/fake-consent", include_in_schema=False)
async def fake_consent(
    request: Request, redirect_uri: str = Query(...), state: str = Query(...)
) -> HTMLResponse:
    """Development-only stand-in for Google's account picker (fake provider mode)."""
    if not isinstance(getattr(request.app.state, "google_oauth", None), FakeGoogleOAuth):
        raise NotFoundError("Not found.")
    # The redirect target is fixed to our own callback path; the query only carries state/code.
    target = _app_url(CALLBACK_PATH)
    field = (
        "width:100%;padding:8px;margin:4px 0 12px;border-radius:8px;border:1px solid #333;"
        "background:#0c0c0c;color:#fff"
    )
    page = "\n".join(
        [
            '<!doctype html><meta charset="utf-8"><title>Fake Google consent</title>',
            '<body style="font-family:system-ui;background:#0c0c0c;color:#f5f5f5;display:grid;'
            'place-items:center;height:100vh;margin:0">',
            f'<form method="get" action="{html.escape(target)}" '
            'style="background:#161616;padding:32px;border-radius:16px;width:360px">',
            '<h1 style="font-size:18px;margin:0 0 4px">Choose an account</h1>',
            '<p style="color:#9b9b9b;font-size:13px;margin:0 0 16px">Local stand-in for Google '
            "(USE_FAKE_PROVIDERS). Nothing leaves this machine.</p>",
            f'<input type="hidden" name="state" value="{html.escape(state)}">',
            '<input type="hidden" name="code" value="fake-code">',
            '<label style="font-size:12px;color:#9b9b9b">Email<br>'
            f'<input name="email" value="reviewer@example.com" style="{field}"></label>',
            '<label style="font-size:12px;color:#9b9b9b">Name<br>'
            f'<input name="name" value="Reviewer" style="{field}"></label>',
            '<label style="font-size:12px;color:#9b9b9b;display:block;margin-bottom:16px">'
            '<input type="checkbox" name="verified" value="1" checked> Email verified</label>',
            '<button type="submit" style="width:100%;padding:10px;border-radius:999px;border:0;'
            'background:#d6ff00;font-weight:600">Continue</button>',
            "</form></body>",
        ]
    )
    return HTMLResponse(page)
