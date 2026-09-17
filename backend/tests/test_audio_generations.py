import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.audio import sniff_audio
from app.core.ratelimit import audio_user_limiter
from app.models import Asset, Generation, GenerationStatus, GenerationType, MediaType
from app.providers.base import ProviderErrorCode
from app.providers.fake_audio import FakeAudioProvider
from app.services.runtime import GenerationRuntime
from app.storage.fake_storage import FakeStorage
from tests.conftest import TEST_DATABASE_URL
from tests.test_generations import USER_A, USER_B, signup

AUDIO = {"text": "Welcome to Higgsfield. Lifelike speech from any script.", "model_id": "melotts"}


@pytest.fixture(autouse=True)
def _reset_audio_limit() -> None:
    audio_user_limiter.reset()


async def create_audio_and_wait(
    client: AsyncClient, runtime: GenerationRuntime, payload: dict[str, object]
) -> dict:
    response = await client.post("/api/generations/audio", json=payload)
    assert response.status_code == 202, response.text
    body = response.json()
    assert body["status"] == "queued" and body["type"] == "audio"
    await runtime.wait_idle()
    final = await client.get(f"/api/generations/{body['id']}")
    assert final.status_code == 200
    return final.json()


def cloudflare_fake(runtime: GenerationRuntime) -> FakeAudioProvider:
    provider = runtime.audio_providers["cloudflare"]
    assert isinstance(provider, FakeAudioProvider)
    return provider


async def test_anonymous_audio_rejected(client: AsyncClient) -> None:
    assert (await client.post("/api/generations/audio", json=AUDIO)).status_code == 401


async def test_audio_models_expose_voices_and_languages(client: AsyncClient) -> None:
    models = {m["id"]: m for m in (await client.get("/api/models", params={"type": "audio"})).json()}
    assert list(models) == ["aura-1", "melotts", "gemini-tts"]
    assert [lang["code"] for lang in models["melotts"]["languages"]] == ["en", "es", "fr", "zh", "ja", "ko"]
    assert models["melotts"]["voices"] == [] and models["melotts"]["default_language"] == "en"
    assert len(models["aura-1"]["voices"]) == 12 and models["aura-1"]["default_voice"] == "luna"
    assert models["gemini-tts"]["supports_style_prompt"] and models["gemini-tts"]["default_voice"] == "Kore"


async def test_melotts_generation_completes(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    result = await create_audio_and_wait(client, runtime, {**AUDIO, "language": "fr", "batch_size": 2})
    assert result["status"] == "completed" and result["provider"] == "cloudflare"
    assert result["settings"] == {"batch_size": 2, "language": "fr"}
    assert len(result["assets"]) == 2
    asset = result["assets"][0]
    assert asset["media_type"] == "audio" and asset["mime_type"] == "audio/wav"
    assert asset["duration_ms"] and asset["duration_ms"] > 500
    calls = cloudflare_fake(runtime).calls
    assert calls[0][0] == "@cf/myshell-ai/melotts" and calls[0][1].language == "fr"
    storage = runtime.storage
    assert isinstance(storage, FakeStorage)
    assert storage.uploads[0][0].endswith("/audio") and storage.uploads[0][1] == MediaType.AUDIO


async def test_aura_voice_and_gemini_style(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    aura = await create_audio_and_wait(client, runtime, {**AUDIO, "model_id": "aura-1", "voice": "orion"})
    assert aura["settings"] == {"batch_size": 1, "voice": "orion"}
    assert cloudflare_fake(runtime).calls[-1][0] == "@cf/deepgram/aura-1"

    gemini = await create_audio_and_wait(
        client, runtime, {**AUDIO, "model_id": "gemini-tts", "style_prompt": "warm narrator"}
    )
    assert gemini["provider"] == "gemini"
    assert gemini["settings"] == {"batch_size": 1, "voice": "Kore", "style_prompt": "warm narrator"}
    gemini_provider = runtime.audio_providers["gemini"]
    assert isinstance(gemini_provider, FakeAudioProvider)
    assert gemini_provider.calls[0][1].style_prompt == "warm narrator"


async def test_audio_record_persisted(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    result = await create_audio_and_wait(client, runtime, AUDIO)
    engine = create_async_engine(TEST_DATABASE_URL)
    async with async_sessionmaker(engine, class_=AsyncSession)() as db:
        generation = (await db.execute(select(Generation))).scalar_one()
        asset = (await db.execute(select(Asset))).scalar_one()
    await engine.dispose()
    assert str(generation.id) == result["id"] and generation.type == GenerationType.AUDIO
    assert generation.status == GenerationStatus.COMPLETED and generation.prompt == AUDIO["text"]
    assert asset.media_type == MediaType.AUDIO and asset.generation_id == generation.id


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({**AUDIO, "text": "   "}, "text"),
        ({**AUDIO, "text": "x" * 2001}, "text"),
        ({**AUDIO, "model_id": "flux-1-schnell"}, "model_id"),
        ({**AUDIO, "model_id": "@cf/myshell-ai/melotts"}, "model_id"),
        ({**AUDIO, "voice": "luna"}, "voice"),  # melotts has no voice list
        ({**AUDIO, "model_id": "aura-1", "voice": "not-a-voice"}, "voice"),
        ({**AUDIO, "language": "xx"}, "language"),
        ({**AUDIO, "model_id": "aura-1", "language": "en"}, "language"),
        ({**AUDIO, "style_prompt": "whisper"}, "style_prompt"),
        ({**AUDIO, "model_id": "gemini-tts", "batch_size": 2}, "batch_size"),
    ],
)
async def test_invalid_audio_requests(client: AsyncClient, payload: dict[str, object], field: str) -> None:
    await signup(client, USER_A)
    response = await client.post("/api/generations/audio", json=payload)
    assert response.status_code == 422, response.text
    assert any(f["field"] == field for f in response.json()["error"]["details"]["fields"])


@pytest.mark.parametrize(
    ("code", "fragment"),
    [
        (ProviderErrorCode.TIMEOUT, "too long"),
        (ProviderErrorCode.RATE_LIMITED, "busy"),
        (ProviderErrorCode.AUTH_FAILED, "credentials"),
    ],
)
async def test_audio_provider_failure(
    client: AsyncClient, runtime: GenerationRuntime, code: ProviderErrorCode, fragment: str
) -> None:
    runtime.audio_providers["cloudflare"] = FakeAudioProvider(fail_with=code)
    await signup(client, USER_A)
    result = await create_audio_and_wait(client, runtime, AUDIO)
    assert result["status"] == "failed" and result["error_code"] == code.value
    assert fragment in result["error_message"].lower() and result["assets"] == []


async def test_audio_quota_message_is_safe(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    result = await create_audio_and_wait(client, runtime, {**AUDIO, "text": "[quota] anything"})
    assert result["error_code"] == "quota_exceeded"
    assert result["error_message"].startswith("Daily free speech generation quota has been used")


async def test_audio_storage_failure(client: AsyncClient, runtime: GenerationRuntime) -> None:
    runtime.storage = FakeStorage(fail=True, serve_locally=False)
    await signup(client, USER_A)
    result = await create_audio_and_wait(client, runtime, AUDIO)
    assert result["status"] == "failed" and result["error_code"] == "storage_error"


async def test_audio_provider_not_configured(client: AsyncClient, runtime: GenerationRuntime) -> None:
    runtime.audio_providers = {}
    await signup(client, USER_A)
    result = await create_audio_and_wait(client, runtime, AUDIO)
    assert result["status"] == "failed" and result["error_code"] == "provider_not_configured"


async def test_audio_ownership_history_and_retry(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    failed = await create_audio_and_wait(
        client, runtime, {**AUDIO, "text": "[fail] broken", "model_id": "aura-1", "voice": "zeus"}
    )
    assert failed["status"] == "failed"
    retried = await client.post(f"/api/generations/{failed['id']}/retry")
    assert retried.status_code == 202
    assert retried.json()["type"] == "audio" and retried.json()["parent_generation_id"] == failed["id"]
    assert retried.json()["settings"]["voice"] == "zeus"
    await runtime.wait_idle()
    listing = (await client.get("/api/generations", params={"type": "audio"})).json()["items"]
    assert len(listing) == 2 and all(g["type"] == "audio" for g in listing)
    await signup(client, USER_B)
    assert (await client.get(f"/api/generations/{failed['id']}")).status_code == 404
    assert (await client.post(f"/api/generations/{failed['id']}/retry")).status_code == 404


async def test_audio_rate_limit(client: AsyncClient, runtime: GenerationRuntime) -> None:
    await signup(client, USER_A)
    statuses = [(await client.post("/api/generations/audio", json=AUDIO)).status_code for _ in range(11)]
    assert statuses[:10] == [202] * 10 and statuses[10] == 429
    await runtime.wait_idle()


def test_sniff_audio_recognizes_formats() -> None:
    from app.providers.fake_audio import render_tone

    wav = sniff_audio(render_tone("hello", None))
    assert wav and wav.mime_type == "audio/wav" and wav.duration_ms and wav.duration_ms > 0
    mp3 = sniff_audio(b"\xff\xf3\x60\xc4" + b"\x00" * 200)
    assert mp3 and mp3.mime_type == "audio/mpeg"
    assert sniff_audio(b"not audio at all" * 10) is None
