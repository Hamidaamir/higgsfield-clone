import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.ratelimit import video_global_limiter, video_user_limiter
from app.models import Asset, Generation, GenerationStatus, GenerationType, MediaType
from app.providers.base import ProviderErrorCode
from app.providers.fake_video import FakeVideoProvider
from app.services.runtime import GenerationRuntime
from app.storage.fake_storage import FakeStorage
from tests.conftest import TEST_DATABASE_URL
from tests.helpers import png_bytes
from tests.test_generations import USER_A, USER_B, signup

VIDEO = {"prompt": "a lime jacket walking through neon rain", "model_id": "ltx-video"}


@pytest.fixture(autouse=True)
def _reset_video_limits() -> None:
    video_user_limiter.reset()
    video_global_limiter.reset()


async def create_video_and_wait(
    client: AsyncClient, runtime: GenerationRuntime, payload: dict[str, object]
) -> dict:
    response = await client.post("/api/generations/video", json=payload)
    assert response.status_code == 202, response.text
    body = response.json()
    assert body["status"] == "queued" and body["type"] == "video"
    await runtime.wait_idle()
    final = await client.get(f"/api/generations/{body['id']}")
    assert final.status_code == 200
    return final.json()


async def test_anonymous_video_rejected(client: AsyncClient) -> None:
    response = await client.post("/api/generations/video", json=VIDEO)
    assert response.status_code == 401


async def test_video_model_listed_with_durations(client: AsyncClient) -> None:
    models = (await client.get("/api/models", params={"type": "video"})).json()
    assert [m["id"] for m in models] == ["ltx-video"]
    assert models[0]["durations_s"] == [2, 3, 4, 5] and models[0]["default_duration_s"] == 3
    assert models[0]["aspect_ratios"] == ["16:9", "9:16", "1:1"] and models[0]["supports_reference_image"]


async def test_text_to_video_completes_with_video_asset(
    client: AsyncClient, runtime: GenerationRuntime
) -> None:
    await signup(client, USER_A)
    result = await create_video_and_wait(client, runtime, {**VIDEO, "aspect_ratio": "9:16", "duration_s": 4})
    assert result["status"] == "completed" and result["provider"] == "hf-space"
    assert result["settings"] == {"aspect_ratio": "9:16", "duration_s": 4}
    assert result["started_at"] and result["completed_at"]
    asset = result["assets"][0]
    assert asset["media_type"] == "video" and asset["mime_type"] == "video/webm"
    assert asset["duration_ms"] == 4000 and asset["width"] == 192

    provider = runtime.video_provider
    assert isinstance(provider, FakeVideoProvider)
    space, request = provider.calls[0]
    assert space == "Lightricks/ltx-video-distilled"
    assert (request.width, request.height, request.duration_s) == (448, 768, 4.0)
    assert request.reference_image is None
    storage = runtime.storage
    assert isinstance(storage, FakeStorage) and storage.uploads[0][0].endswith("/videos")
    assert storage.uploads[0][1] == MediaType.VIDEO


async def test_video_record_persisted(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    result = await create_video_and_wait(client, runtime, VIDEO)
    engine = create_async_engine(TEST_DATABASE_URL)
    async with async_sessionmaker(engine, class_=AsyncSession)() as db:
        generation = (await db.execute(select(Generation))).scalar_one()
        asset = (await db.execute(select(Asset))).scalar_one()
    await engine.dispose()
    assert str(generation.id) == result["id"]
    assert generation.type == GenerationType.VIDEO and generation.status == GenerationStatus.COMPLETED
    assert asset.media_type == MediaType.VIDEO and asset.generation_id == generation.id


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({**VIDEO, "model_id": "flux-1-schnell"}, "model_id"),  # image model on the video endpoint
        ({**VIDEO, "model_id": "Lightricks/ltx-video-distilled"}, "model_id"),  # raw space id
        ({**VIDEO, "aspect_ratio": "4:3"}, "aspect_ratio"),
        ({**VIDEO, "duration_s": 9}, "duration_s"),
        ({**VIDEO, "prompt": " "}, "prompt"),
        ({**VIDEO, "reference_asset_id": "00000000-0000-0000-0000-000000000001"}, "reference_asset_id"),
    ],
)
async def test_invalid_video_requests(client: AsyncClient, payload: dict[str, object], field: str) -> None:
    await signup(client, USER_A)
    response = await client.post("/api/generations/video", json=payload)
    assert response.status_code == 422, response.text
    assert any(f["field"] == field for f in response.json()["error"]["details"]["fields"])


@pytest.mark.parametrize(
    ("code", "fragment"),
    [(ProviderErrorCode.TIMEOUT, "too long"), (ProviderErrorCode.MODEL_UNAVAILABLE, "unavailable")],
)
async def test_video_provider_failure(
    client: AsyncClient, runtime: GenerationRuntime, code: ProviderErrorCode, fragment: str
) -> None:
    runtime.video_provider = FakeVideoProvider(fail_with=code)
    await signup(client, USER_A)
    result = await create_video_and_wait(client, runtime, VIDEO)
    assert result["status"] == "failed" and result["error_code"] == code.value
    assert fragment in result["error_message"].lower() and result["assets"] == []


async def test_video_quota_exhaustion_is_safe(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    result = await create_video_and_wait(client, runtime, {**VIDEO, "prompt": "[quota] anything"})
    assert result["status"] == "failed" and result["error_code"] == "quota_exceeded"
    assert result["error_message"].startswith("Daily free video generation quota has been used")
    assert "zerogpu" not in result["error_message"].lower()


async def test_video_storage_failure(client: AsyncClient, runtime: GenerationRuntime) -> None:
    runtime.storage = FakeStorage(fail=True, serve_locally=False)
    await signup(client, USER_A)
    result = await create_video_and_wait(client, runtime, VIDEO)
    assert result["status"] == "failed" and result["error_code"] == "storage_error"


async def test_video_provider_not_configured(client: AsyncClient, runtime: GenerationRuntime) -> None:
    runtime.video_provider = None
    await signup(client, USER_A)
    result = await create_video_and_wait(client, runtime, VIDEO)
    assert result["status"] == "failed" and result["error_code"] == "provider_not_configured"


async def test_video_ownership_and_history_filter(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    mine = await create_video_and_wait(client, runtime, VIDEO)
    listing = (await client.get("/api/generations", params={"type": "video"})).json()
    assert [g["id"] for g in listing["items"]] == [mine["id"]]
    assert (await client.get("/api/generations", params={"type": "image"})).json()["items"] == []
    await signup(client, USER_B)
    assert (await client.get(f"/api/generations/{mine['id']}")).status_code == 404
    assert (await client.post(f"/api/generations/{mine['id']}/retry")).status_code == 404


async def test_video_retry_links_parent(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    parent = await create_video_and_wait(
        client, runtime, {**VIDEO, "prompt": "[fail] broken", "aspect_ratio": "1:1"}
    )
    assert parent["status"] == "failed"
    retried = await client.post(f"/api/generations/{parent['id']}/retry")
    assert retried.status_code == 202
    body = retried.json()
    assert body["type"] == "video" and body["parent_generation_id"] == parent["id"]
    assert body["settings"]["aspect_ratio"] == "1:1"
    await runtime.wait_idle()


async def test_one_video_in_flight_per_user(client: AsyncClient, runtime: GenerationRuntime) -> None:
    runtime.video_provider = FakeVideoProvider(latency_s=0.5)
    await signup(client, USER_A)
    first = await client.post("/api/generations/video", json=VIDEO)
    assert first.status_code == 202
    second = await client.post("/api/generations/video", json=VIDEO)
    assert second.status_code == 409
    assert "already generating" in second.json()["error"]["message"]
    await runtime.wait_idle()
    assert (await client.post("/api/generations/video", json=VIDEO)).status_code == 202
    await runtime.wait_idle()


async def test_video_submission_caps(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    for _ in range(3):
        await create_video_and_wait(client, runtime, VIDEO)
    fourth = await client.post("/api/generations/video", json=VIDEO)
    assert fourth.status_code == 429 and "video generations" in fourth.json()["error"]["message"]


async def test_image_to_video_with_uploaded_reference(
    client: AsyncClient, runtime: GenerationRuntime
) -> None:
    await signup(client, USER_A)
    upload = await client.post(
        "/api/assets/upload", files={"file": ("ref.png", png_bytes(320, 200), "image/png")}
    )
    assert upload.status_code == 201, upload.text
    asset = upload.json()
    assert asset["media_type"] == "image" and asset["width"] == 320
    result = await create_video_and_wait(client, runtime, {**VIDEO, "reference_asset_id": asset["id"]})
    assert result["status"] == "completed"
    assert result["settings"]["reference_asset_id"] == asset["id"]
    provider = runtime.video_provider
    assert isinstance(provider, FakeVideoProvider)
    assert provider.calls[0][1].reference_image is not None


@pytest.mark.parametrize(
    ("filename", "content", "mime"),
    [
        ("notes.txt", b"hello world" * 10, "text/plain"),
        ("fake.png", b"\x89PNG not really" * 10, "image/png"),
    ],
)
async def test_upload_rejects_non_images(
    client: AsyncClient, filename: str, content: bytes, mime: str
) -> None:
    await signup(client, USER_A)
    response = await client.post("/api/assets/upload", files={"file": (filename, content, mime)})
    assert response.status_code == 422
    assert "PNG, JPEG or WebP" in response.json()["error"]["message"]


async def test_image_edit_with_reference(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    upload = await client.post("/api/assets/upload", files={"file": ("ref.png", png_bytes(), "image/png")})
    asset_id = upload.json()["id"]
    rejected = await client.post(
        "/api/generations/image",
        json={"prompt": "make it snow", "model_id": "flux-1-schnell", "reference_asset_id": asset_id},
    )
    assert rejected.status_code == 422  # schnell has no reference support
    response = await client.post(
        "/api/generations/image",
        json={"prompt": "make it snow", "model_id": "flux-2-klein", "reference_asset_id": asset_id},
    )
    assert response.status_code == 202, response.text
    await runtime.wait_idle()
    result = (await client.get(f"/api/generations/{response.json()['id']}")).json()
    assert result["status"] == "completed" and result["settings"]["reference_asset_id"] == asset_id
    from app.providers.fake_image import FakeImageProvider

    provider = runtime.image_provider
    assert isinstance(provider, FakeImageProvider)
    assert provider.calls[-1][1].reference_image is not None
    retried = await client.post(f"/api/generations/{result['id']}/retry")
    assert retried.status_code == 202 and retried.json()["settings"]["reference_asset_id"] == asset_id
    await runtime.wait_idle()


async def test_reference_must_belong_to_user(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_B)
    upload = await client.post("/api/assets/upload", files={"file": ("ref.png", png_bytes(), "image/png")})
    theirs = upload.json()["id"]
    await signup(client, USER_A)
    response = await client.post("/api/generations/video", json={**VIDEO, "reference_asset_id": theirs})
    assert response.status_code == 422
