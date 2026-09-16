import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password, verify_password
from app.models import Session, User
from tests.conftest import TEST_DATABASE_URL

SIGNUP = {"email": "Ada@Example.com", "password": "hunter2024", "name": "Ada", "accept_terms": True}


async def test_signup_creates_user_and_session_cookie(client: AsyncClient) -> None:
    response = await client.post("/api/auth/signup", json=SIGNUP)
    assert response.status_code == 201
    body = response.json()["user"]
    assert body["email"] == "Ada@example.com"  # EmailStr lower-cases the domain part
    assert body["name"] == "Ada"
    assert "password" not in body and "password_hash" not in body
    cookie = response.headers["set-cookie"].lower()
    assert "hf_session=" in cookie and "httponly" in cookie and "samesite=lax" in cookie


async def test_duplicate_email_is_rejected_case_insensitively(client: AsyncClient) -> None:
    assert (await client.post("/api/auth/signup", json=SIGNUP)).status_code == 201
    response = await client.post("/api/auth/signup", json={**SIGNUP, "email": "ada@example.com"})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "conflict"


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"email": "not-an-email"}, "email"),
        ({"password": "short1"}, "password"),
        ({"password": "onlyletters"}, "password"),
        ({"password": "12345678"}, "password"),
        ({"name": "   "}, "name"),
        ({"accept_terms": False}, "accept_terms"),
    ],
)
async def test_signup_validation(client: AsyncClient, overrides: dict[str, object], field: str) -> None:
    response = await client.post("/api/auth/signup", json={**SIGNUP, **overrides})
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert any(f["field"] == field for f in error["details"]["fields"])


async def test_login_success_and_me(client: AsyncClient) -> None:
    await client.post("/api/auth/signup", json=SIGNUP)
    client.cookies.clear()
    response = await client.post(
        "/api/auth/login", json={"email": "ada@example.com", "password": "hunter2024"}
    )
    assert response.status_code == 200
    me = await client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["user"]["email"] == "Ada@example.com"


@pytest.mark.parametrize(
    "payload",
    [
        {"email": "ada@example.com", "password": "wrong-pass1"},
        {"email": "nobody@example.com", "password": "hunter2024"},
    ],
)
async def test_login_failure_is_generic(client: AsyncClient, payload: dict[str, str]) -> None:
    await client.post("/api/auth/signup", json=SIGNUP)
    client.cookies.clear()
    response = await client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Invalid email or password."
    assert "hf_session" not in response.headers.get("set-cookie", "")


async def test_me_is_null_for_anonymous_and_forged_tokens(client: AsyncClient) -> None:
    response = await client.get("/api/auth/me")
    assert response.status_code == 200 and response.json() == {"user": None}
    client.cookies.set("hf_session", "forged-token")
    assert (await client.get("/api/auth/me")).json() == {"user": None}


async def test_protected_endpoint_rejects_anonymous_and_bad_tokens(client: AsyncClient) -> None:
    assert (await client.get("/api/_test/protected")).status_code == 401
    client.cookies.set("hf_session", "forged-token")
    response = await client.get("/api/_test/protected")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"
    client.cookies.clear()
    await client.post("/api/auth/signup", json=SIGNUP)
    assert (await client.get("/api/_test/protected")).json()["email"] == "Ada@example.com"


async def test_logout_invalidates_session(client: AsyncClient) -> None:
    await client.post("/api/auth/signup", json=SIGNUP)
    raw_token = client.cookies.get("hf_session")
    assert raw_token
    response = await client.post("/api/auth/logout")
    assert response.status_code == 204
    # Even if the browser kept the cookie, the server no longer honours it.
    client.cookies.set("hf_session", raw_token)
    assert (await client.get("/api/auth/me")).json() == {"user": None}
    assert (await client.get("/api/_test/protected")).status_code == 401


async def test_password_and_token_are_stored_hashed(client: AsyncClient) -> None:
    await client.post("/api/auth/signup", json=SIGNUP)
    raw_token = client.cookies.get("hf_session")
    engine = create_async_engine(TEST_DATABASE_URL)
    factory = async_sessionmaker(engine, class_=AsyncSession)
    async with factory() as db:
        user = (await db.execute(select(User))).scalar_one()
        session = (await db.execute(select(Session))).scalar_one()
    await engine.dispose()
    assert user.password_hash != SIGNUP["password"]
    assert user.password_hash.startswith("$2b$")
    assert verify_password("hunter2024", user.password_hash)
    assert session.token_hash != raw_token and len(session.token_hash) == 64


def test_hash_password_is_salted() -> None:
    assert hash_password("same-password1") != hash_password("same-password1")
