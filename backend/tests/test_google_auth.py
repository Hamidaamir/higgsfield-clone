"""Google sign-in through the FakeGoogleOAuth provider boundary — no request ever reaches Google."""

from urllib.parse import parse_qs, urlparse

import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import User, UserIdentity
from app.services.google_oauth import FakeGoogleOAuth, GoogleIdentity
from tests.conftest import TEST_DATABASE_URL
from tests.test_auth import SIGNUP

ALICE = GoogleIdentity(
    sub="google-sub-alice", email="alice@example.com", email_verified=True, name="Alice Liddell"
)


async def count(model: type[User] | type[UserIdentity]) -> int:
    engine = create_async_engine(TEST_DATABASE_URL)
    async with async_sessionmaker(engine, class_=AsyncSession)() as db:
        n = await db.scalar(select(func.count()).select_from(model))
    await engine.dispose()
    return int(n or 0)


async def start(client: AsyncClient, next_path: str | None = None) -> str:
    """Kick off the flow and return the `state` the fake consent page would carry back."""
    params = {"next": next_path} if next_path else {}
    response = await client.get("/api/auth/google/start", params=params)
    assert response.status_code == 302, response.text
    location = response.headers["location"]
    assert location.startswith("/api/auth/google/fake-consent?")
    query = parse_qs(urlparse(location).query)
    assert query["redirect_uri"] == ["http://localhost:3000/api/auth/google/callback"]
    assert "hf_oauth=" in response.headers.get("set-cookie", "")  # short-lived transaction cookie
    return query["state"][0]


async def callback(client: AsyncClient, state: str, **extra: str) -> tuple[int, str]:
    response = await client.get("/api/auth/google/callback", params={"state": state, "code": "fake", **extra})
    return response.status_code, response.headers.get("location", "")


async def google_login(
    client: AsyncClient, app: FastAPI, identity: GoogleIdentity, next_path: str | None = None
) -> str:
    app.state.google_oauth = FakeGoogleOAuth(identity=identity)
    state = await start(client, next_path)
    status, location = await callback(client, state)
    assert status == 302, location
    return location


async def test_providers_reports_google_availability(client: AsyncClient, app: FastAPI) -> None:
    app.state.google_oauth = None
    assert (await client.get("/api/auth/providers")).json() == {"google": False, "fake_google": False}
    app.state.google_oauth = FakeGoogleOAuth()
    assert (await client.get("/api/auth/providers")).json() == {"google": True, "fake_google": True}


async def test_start_is_unavailable_without_configuration(client: AsyncClient, app: FastAPI) -> None:
    app.state.google_oauth = None
    response = await client.get("/api/auth/google/start")
    assert response.status_code == 503 and response.json()["error"]["code"] == "service_unavailable"


async def test_new_google_user_gets_account_and_session(client: AsyncClient, app: FastAPI) -> None:
    location = await google_login(client, app, ALICE, "/generate/video")
    assert location == "http://localhost:3000/generate/video"
    me = (await client.get("/api/auth/me")).json()["user"]
    assert me["email"] == "alice@example.com" and me["name"] == "Alice Liddell"
    assert me["has_password"] is False
    assert (await client.get("/api/_test/protected")).status_code == 200  # same session model
    assert await count(User) == 1 and await count(UserIdentity) == 1


async def test_repeat_login_reuses_the_same_user(client: AsyncClient, app: FastAPI) -> None:
    await google_login(client, app, ALICE)
    first = (await client.get("/api/auth/me")).json()["user"]["id"]
    await client.post("/api/auth/logout")
    # Same subject, different display data: still the same account, no new identity row.
    await google_login(
        client, app, ALICE.model_copy(update={"name": "A. Liddell", "email": "alice@example.com"})
    )
    assert (await client.get("/api/auth/me")).json()["user"]["id"] == first
    assert await count(User) == 1 and await count(UserIdentity) == 1


async def test_verified_google_email_links_existing_password_account(
    client: AsyncClient, app: FastAPI
) -> None:
    signup = await client.post("/api/auth/signup", json={**SIGNUP, "email": "alice@example.com"})
    assert signup.status_code == 201
    password_user_id = signup.json()["user"]["id"]
    await client.post("/api/auth/logout")

    await google_login(client, app, ALICE)
    me = (await client.get("/api/auth/me")).json()["user"]
    assert me["id"] == password_user_id and me["has_password"] is True
    assert await count(User) == 1 and await count(UserIdentity) == 1
    # The password still works afterwards — linking never weakens the original login.
    await client.post("/api/auth/logout")
    login = await client.post(
        "/api/auth/login", json={"email": "alice@example.com", "password": SIGNUP["password"]}
    )
    assert login.status_code == 200


async def test_unverified_email_is_rejected(client: AsyncClient, app: FastAPI) -> None:
    app.state.google_oauth = FakeGoogleOAuth(identity=ALICE.model_copy(update={"email_verified": False}))
    state = await start(client)
    status, location = await callback(client, state)
    assert status == 302 and location == "http://localhost:3000/login?error=google_unverified"
    assert (await client.get("/api/auth/me")).json()["user"] is None
    assert await count(User) == 0


async def test_invalid_state_is_rejected(client: AsyncClient, app: FastAPI) -> None:
    app.state.google_oauth = FakeGoogleOAuth(identity=ALICE)
    await start(client)
    status, location = await callback(client, "not-the-state")
    assert status == 302 and location.endswith("/login?error=google")
    assert (await client.get("/api/auth/me")).json()["user"] is None


async def test_callback_without_start_is_rejected(client: AsyncClient, app: FastAPI) -> None:
    app.state.google_oauth = FakeGoogleOAuth(identity=ALICE)
    status, location = await callback(client, "anything")
    assert status == 302 and location.endswith("/login?error=google")


async def test_provider_failure_is_handled_safely(client: AsyncClient, app: FastAPI) -> None:
    app.state.google_oauth = FakeGoogleOAuth(identity=ALICE, fail=True)
    state = await start(client)
    status, location = await callback(client, state)
    assert status == 302 and location.endswith("/login?error=google")
    assert await count(User) == 0


@pytest.mark.parametrize(
    "bad_next",
    [
        "https://evil.example/phish",
        "//evil.example",
        "javascript:alert(1)",
        "generate/image",
        "/\\evil.example",
    ],
)
async def test_external_next_is_ignored(client: AsyncClient, app: FastAPI, bad_next: str) -> None:
    location = await google_login(client, app, ALICE, bad_next)
    assert location == "http://localhost:3000/generate/image"


async def test_internal_next_with_query_is_preserved(client: AsyncClient, app: FastAPI) -> None:
    location = await google_login(client, app, ALICE, "/generate/video?model=ltx-video&prompt=hi")
    assert location == "http://localhost:3000/generate/video?model=ltx-video&prompt=hi"


async def test_google_only_account_cannot_password_login(client: AsyncClient, app: FastAPI) -> None:
    await google_login(client, app, ALICE)
    await client.post("/api/auth/logout")
    login = await client.post(
        "/api/auth/login", json={"email": "alice@example.com", "password": "anything123"}
    )
    assert login.status_code == 401
    # And email signup for that address is a normal conflict, not a takeover.
    signup = await client.post("/api/auth/signup", json={**SIGNUP, "email": "alice@example.com"})
    assert signup.status_code == 409


async def test_logout_after_google_login(client: AsyncClient, app: FastAPI) -> None:
    await google_login(client, app, ALICE)
    assert (await client.post("/api/auth/logout")).status_code == 204
    assert (await client.get("/api/auth/me")).json()["user"] is None
    assert (await client.get("/api/_test/protected")).status_code == 401


async def test_fake_consent_only_in_fake_mode(client: AsyncClient, app: FastAPI) -> None:
    app.state.google_oauth = None
    assert (
        await client.get("/api/auth/google/fake-consent", params={"redirect_uri": "x", "state": "y"})
    ).status_code == 404
    app.state.google_oauth = FakeGoogleOAuth()
    page = await client.get("/api/auth/google/fake-consent", params={"redirect_uri": "x", "state": "abc"})
    assert page.status_code == 200 and 'name="state" value="abc"' in page.text
