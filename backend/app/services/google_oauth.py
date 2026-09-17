"""Google sign-in (OpenID Connect, authorization-code flow).

The provider boundary is the `GoogleOAuth` protocol: the real client delegates the protocol
work — state + nonce, code exchange, ID-token signature/nonce/audience verification — to
Authlib's Starlette integration; the fake client reproduces the same round trip in-process for
tests and `USE_FAKE_PROVIDERS` development, so nothing here ever talks to Google in tests.
"""

from __future__ import annotations

import logging
import secrets
from typing import Any, Protocol
from urllib.parse import urlencode

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, ConfigDict

from app.config import Settings

log = logging.getLogger(__name__)

PROVIDER = "google"
SCOPES = "openid email profile"
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
# Keys inside the short-lived, signed OAuth cookie session (see SessionMiddleware in main.py).
SESSION_NEXT_KEY = "hf_oauth_next"
FAKE_STATE_KEY = "hf_oauth_fake_state"


class GoogleIdentity(BaseModel):
    """The verified claims we rely on. `sub` is Google's stable per-user id and is the only
    value ever used to find an existing identity."""

    model_config = ConfigDict(extra="ignore")

    sub: str
    email: str
    email_verified: bool = False
    name: str | None = None
    picture: str | None = None


class GoogleSignInError(Exception):
    """The round trip did not produce a usable identity (denied, expired state, provider failure)."""


class GoogleOAuth(Protocol):
    async def authorize_redirect(self, request: Request, redirect_uri: str) -> RedirectResponse:
        """Send the browser to the provider's consent screen, remembering state (and nonce)."""
        ...

    async def complete(self, request: Request) -> GoogleIdentity:
        """Finish the flow from the callback request: validate state, exchange the code, return claims."""
        ...


class AuthlibGoogleOAuth:
    """Real Google via Authlib: discovery document, PKCE-less code flow, ID token verified with
    Google's JWKS, nonce and state checked against the signed session cookie."""

    def __init__(self, client_id: str, client_secret: str) -> None:
        self._oauth = OAuth()
        self._oauth.register(
            name=PROVIDER,
            client_id=client_id,
            client_secret=client_secret,
            server_metadata_url=GOOGLE_DISCOVERY_URL,
            client_kwargs={"scope": SCOPES, "prompt": "select_account"},
        )

    @property
    def _google(self) -> Any:
        return self._oauth.google

    async def authorize_redirect(self, request: Request, redirect_uri: str) -> RedirectResponse:
        response: RedirectResponse = await self._google.authorize_redirect(request, redirect_uri)
        return response

    async def complete(self, request: Request) -> GoogleIdentity:
        try:
            token = await self._google.authorize_access_token(request)
        except OAuthError as exc:
            # Authlib error descriptions can echo provider text; log the code, not the details.
            log.warning("google oauth failed: %s", exc.error)
            raise GoogleSignInError("Google sign-in was not completed.") from exc
        claims = token.get("userinfo") or {}
        if not claims.get("sub"):
            raise GoogleSignInError("Google did not return an identity.")
        return GoogleIdentity.model_validate(claims)


class FakeGoogleOAuth:
    """Stand-in that keeps the shape of the real flow — a redirect out, a callback with
    `code`+`state`, a state check — but resolves to whichever identity it was configured with.
    Used by the test-suite and by USE_FAKE_PROVIDERS development (never in production)."""

    def __init__(self, identity: GoogleIdentity | None = None, *, fail: bool = False) -> None:
        self.identity = identity
        self.fail = fail
        self.completed = 0

    async def authorize_redirect(self, request: Request, redirect_uri: str) -> RedirectResponse:
        state = secrets.token_urlsafe(16)
        request.session[FAKE_STATE_KEY] = state
        # The "consent screen" lives on our own API so a dev round trip is fully local.
        query = urlencode({"redirect_uri": redirect_uri, "state": state})
        return RedirectResponse(f"/api/auth/google/fake-consent?{query}", status_code=302)

    async def complete(self, request: Request) -> GoogleIdentity:
        self.completed += 1
        expected = request.session.pop(FAKE_STATE_KEY, None)
        received = request.query_params.get("state")
        if not expected or not received or not secrets.compare_digest(expected, received):
            raise GoogleSignInError("Sign-in state is missing or expired.")
        if self.fail or "code" not in request.query_params:
            raise GoogleSignInError("Google sign-in was not completed.")
        # Dev consent page lets the tester type an email; tests preconfigure the identity.
        if self.identity is None:
            email = request.query_params.get("email", "")
            if not email:
                raise GoogleSignInError("Google did not return an identity.")
            return GoogleIdentity(
                sub=f"fake-{email.lower()}",
                email=email,
                email_verified=request.query_params.get("verified") == "1",
                name=request.query_params.get("name") or email.split("@")[0].title(),
            )
        return self.identity


def build_google_oauth(settings: Settings) -> GoogleOAuth | None:
    """Real client when credentials exist; the fake one in fake-provider mode; None otherwise."""
    if settings.google_client_id and settings.google_client_secret:
        return AuthlibGoogleOAuth(settings.google_client_id, settings.google_client_secret.get_secret_value())
    if settings.use_fake_providers:
        log.warning("Google sign-in is using the in-process fake (USE_FAKE_PROVIDERS)")
        return FakeGoogleOAuth()
    return None
