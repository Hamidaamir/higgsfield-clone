import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import Asset, Generation, GenerationStatus
from app.providers.base import ProviderErrorCode
from app.providers.fake_image import FakeImageProvider
from app.services.runtime import GenerationRuntime
from app.storage.fake_storage import FakeStorage
from tests.conftest import TEST_DATABASE_URL

USER_A = {"email": "a@example.com", "password": "passw0rd1", "name": "Ada", "accept_terms": True}
USER_B = {"email": "b@example.com", "password": "passw0rd1", "name": "Bob", "accept_terms": True}
PAYLOAD = {"prompt": "a lime green jacket in a neon city", "model_id": "flux-1-schnell"}


async def signup(client: AsyncClient, user: dict[str, object]) -> None:
    client.cookies.clear()
    assert (await client.post("/api/auth/signup", json=user)).status_code == 201


async def create_and_wait(
    client: AsyncClient, runtime: GenerationRuntime, payload: dict[str, object]
) -> dict:
    response = await client.post("/api/generations/image", json=payload)
    assert response.status_code == 202, response.text
    body = response.json()
    assert body["status"] == "queued"
    await runtime.wait_idle()
    final = await client.get(f"/api/generations/{body['id']}")
    assert final.status_code == 200
    return final.json()


async def test_anonymous_generation_rejected(client: AsyncClient) -> None:
    response = await client.post("/api/generations/image", json=PAYLOAD)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthorized"


async def test_models_endpoint_lists_registry(client: AsyncClient) -> None:
    response = await client.get("/api/models", params={"type": "image"})
    assert response.status_code == 200
    ids = [m["id"] for m in response.json()]
    assert ids[0] == "flux-1-schnell" and "sdxl-lightning" in ids
    schnell = next(m for m in response.json() if m["id"] == "flux-1-schnell")
    assert schnell["aspect_ratios"] == ["1:1"] and schnell["provider"] == "cloudflare"


async def test_valid_generation_completes_with_assets(
    client: AsyncClient, runtime: GenerationRuntime
) -> None:
    await signup(client, USER_A)
    result = await create_and_wait(client, runtime, {**PAYLOAD, "batch_size": 2})
    assert result["status"] == "completed"
    assert result["model_id"] == "flux-1-schnell" and result["provider"] == "cloudflare"
    assert result["settings"] == {"aspect_ratio": "1:1", "batch_size": 2}
    assert result["started_at"] and result["completed_at"]
    assert len(result["assets"]) == 2
    asset = result["assets"][0]
    assert asset["url"].startswith("https://cdn.example.test/") and asset["mime_type"] == "image/png"
    assert asset["width"] == 256 and asset["thumbnail_url"]

    provider = runtime.image_provider
    assert isinstance(provider, FakeImageProvider)
    assert [m for m, _ in provider.calls] == ["@cf/black-forest-labs/flux-1-schnell"] * 2
    storage = runtime.storage
    assert isinstance(storage, FakeStorage) and len(storage.uploads) == 2
    assert storage.uploads[0][0].endswith("/images")


async def test_generation_record_and_assets_persisted(
    client: AsyncClient, runtime: GenerationRuntime
) -> None:
    await signup(client, USER_A)
    result = await create_and_wait(client, runtime, PAYLOAD)
    engine = create_async_engine(TEST_DATABASE_URL)
    async with async_sessionmaker(engine, class_=AsyncSession)() as db:
        generation = (await db.execute(select(Generation))).scalar_one()
        assets = (await db.execute(select(Asset))).scalars().all()
    await engine.dispose()
    assert str(generation.id) == result["id"] and generation.status == GenerationStatus.COMPLETED
    assert generation.prompt == PAYLOAD["prompt"]
    assert len(assets) == 1 and assets[0].storage_provider == "fake-storage"
    assert assets[0].generation_id == generation.id and assets[0].user_id == generation.user_id


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({**PAYLOAD, "model_id": "gpt-image-2"}, "model_id"),
        ({**PAYLOAD, "model_id": "@cf/black-forest-labs/flux-1-schnell"}, "model_id"),
        ({**PAYLOAD, "prompt": "   "}, "prompt"),
        ({**PAYLOAD, "prompt": "x" * 2001}, "prompt"),
        ({**PAYLOAD, "batch_size": 9}, "batch_size"),
        ({**PAYLOAD, "aspect_ratio": "16:9"}, "aspect_ratio"),  # schnell is 1:1 only
        ({**PAYLOAD, "aspect_ratio": "wide"}, "aspect_ratio"),
    ],
)
async def test_invalid_requests_rejected(client: AsyncClient, payload: dict[str, object], field: str) -> None:
    await signup(client, USER_A)
    response = await client.post("/api/generations/image", json=payload)
    assert response.status_code == 422, response.text
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert any(f["field"] == field for f in error["details"]["fields"])


async def test_aspect_ratio_maps_to_dimensions(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    result = await create_and_wait(
        client, runtime, {"prompt": "wide shot", "model_id": "sdxl-lightning", "aspect_ratio": "16:9"}
    )
    assert result["status"] == "completed"
    provider = runtime.image_provider
    assert isinstance(provider, FakeImageProvider)
    request = provider.calls[0][1]
    assert (request.width, request.height) == (1344, 768)


@pytest.mark.parametrize(
    ("code", "message_fragment"),
    [
        (ProviderErrorCode.QUOTA_EXCEEDED, "quota"),
        (ProviderErrorCode.CONTENT_REJECTED, "safety"),
        (ProviderErrorCode.TIMEOUT, "too long"),
    ],
)
async def test_provider_failure_marks_failed(
    client: AsyncClient, runtime: GenerationRuntime, code: ProviderErrorCode, message_fragment: str
) -> None:
    runtime.image_provider = FakeImageProvider(fail_with=code)
    await signup(client, USER_A)
    result = await create_and_wait(client, runtime, PAYLOAD)
    assert result["status"] == "failed"
    assert result["error_code"] == code.value
    assert message_fragment in result["error_message"].lower()
    assert "simulated" not in result["error_message"]  # internal detail never leaks
    assert result["assets"] == [] and result["completed_at"]


async def test_storage_failure_is_a_real_failure(client: AsyncClient, runtime: GenerationRuntime) -> None:
    runtime.storage = FakeStorage(fail=True, data_urls=False)
    await signup(client, USER_A)
    result = await create_and_wait(client, runtime, PAYLOAD)
    assert result["status"] == "failed"
    assert result["error_code"] == "storage_error"
    assert result["assets"] == []


async def test_provider_not_configured(client: AsyncClient, runtime: GenerationRuntime) -> None:
    runtime.image_provider = None
    await signup(client, USER_A)
    result = await create_and_wait(client, runtime, PAYLOAD)
    assert result["status"] == "failed" and result["error_code"] == "provider_not_configured"


async def test_other_users_generation_is_not_found(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    mine = await create_and_wait(client, runtime, PAYLOAD)
    await signup(client, USER_B)
    assert (await client.get(f"/api/generations/{mine['id']}")).status_code == 404
    assert (await client.post(f"/api/generations/{mine['id']}/retry")).status_code == 404
    listing = await client.get("/api/generations")
    assert listing.json()["items"] == []


async def test_list_and_retry(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    first = await create_and_wait(client, runtime, PAYLOAD)
    retried = await client.post(f"/api/generations/{first['id']}/retry")
    assert retried.status_code == 202
    assert retried.json()["parent_generation_id"] == first["id"]
    await runtime.wait_idle()

    page = await client.get("/api/generations", params={"type": "image", "limit": 1})
    body = page.json()
    assert len(body["items"]) == 1 and body["items"][0]["id"] == retried.json()["id"]
    assert body["next_cursor"]
    page2 = await client.get(
        "/api/generations", params={"type": "image", "limit": 1, "cursor": body["next_cursor"]}
    )
    assert page2.json()["items"][0]["id"] == first["id"] and page2.json()["next_cursor"] is None
    assert (await client.get("/api/generations", params={"cursor": "garbage"})).status_code == 422


async def test_rate_limit_protects_quota(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    statuses = [(await client.post("/api/generations/image", json=PAYLOAD)).status_code for _ in range(13)]
    assert statuses[:12] == [202] * 12 and statuses[12] == 429
    await runtime.wait_idle()


async def test_list_search_filters_by_prompt_or_model(
    client: AsyncClient, runtime: GenerationRuntime
) -> None:
    await signup(client, USER_A)
    await create_and_wait(client, runtime, {**PAYLOAD, "prompt": "Golden retriever on a beach"})
    await create_and_wait(client, runtime, {"prompt": "city at night", "model_id": "sdxl-lightning"})
    hits = (await client.get("/api/generations", params={"q": "RETRIEVER"})).json()["items"]
    assert [g["prompt"] for g in hits] == ["Golden retriever on a beach"]
    by_model = (await client.get("/api/generations", params={"q": "sdxl"})).json()["items"]
    assert [g["model_id"] for g in by_model] == ["sdxl-lightning"]
    assert (await client.get("/api/generations", params={"q": "100%_nothing"})).json()["items"] == []
