import base64
import json

import httpx
import pytest

from app.core.audio import pcm16_to_wav
from app.providers.base import AudioGenerationRequest, ProviderError, ProviderErrorCode
from app.providers.cloudflare_tts import AURA_1, MELOTTS, CloudflareTTSProvider
from app.providers.fake_audio import render_tone
from app.providers.gemini_tts import GeminiTTSProvider

REQUEST = AudioGenerationRequest(text="Hello there", voice="luna", language="en")


def cloudflare_with(handler) -> CloudflareTTSProvider:  # type: ignore[no-untyped-def]
    return CloudflareTTSProvider(
        "acct", "token", client=httpx.AsyncClient(transport=httpx.MockTransport(handler))
    )


def gemini_with(handler) -> GeminiTTSProvider:  # type: ignore[no-untyped-def]
    return GeminiTTSProvider("key", client=httpx.AsyncClient(transport=httpx.MockTransport(handler)))


async def test_melotts_json_wav_response() -> None:
    wav = render_tone("hello", None)

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith(MELOTTS)
        assert json.loads(request.content) == {"prompt": "Hello there", "lang": "en"}
        return httpx.Response(200, json={"result": {"audio": base64.b64encode(wav).decode()}})

    output = await cloudflare_with(handler).generate(MELOTTS, REQUEST)
    assert output.mime_type == "audio/wav" and output.duration_ms and output.duration_ms > 0


async def test_aura_binary_mp3_with_speaker() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        assert body == {"text": "Hello there", "encoding": "mp3", "speaker": "luna"}
        return httpx.Response(
            200, content=b"\xff\xf3\x60\xc4" + b"\x00" * 500, headers={"content-type": "audio/mpeg"}
        )

    output = await cloudflare_with(handler).generate(AURA_1, REQUEST)
    assert output.mime_type == "audio/mpeg"


@pytest.mark.parametrize(
    ("status", "body", "expected"),
    [
        (429, {"errors": [{"code": 1, "message": "rate limited"}]}, ProviderErrorCode.RATE_LIMITED),
        (
            403,
            {"errors": [{"code": 2, "message": "neuron quota exceeded"}]},
            ProviderErrorCode.QUOTA_EXCEEDED,
        ),
        (404, {"errors": [{"code": 7000, "message": "no route"}]}, ProviderErrorCode.MODEL_UNAVAILABLE),
    ],
)
async def test_cloudflare_tts_errors(
    status: int, body: dict[str, object], expected: ProviderErrorCode
) -> None:
    with pytest.raises(ProviderError) as exc_info:
        await cloudflare_with(lambda _: httpx.Response(status, json=body)).generate(MELOTTS, REQUEST)
    assert exc_info.value.code == expected


async def test_cloudflare_tts_malformed() -> None:
    with pytest.raises(ProviderError) as exc_info:
        await cloudflare_with(lambda _: httpx.Response(200, content=b"nope" * 100)).generate(MELOTTS, REQUEST)
    assert exc_info.value.code == ProviderErrorCode.MALFORMED_RESPONSE


async def test_gemini_pcm_is_wrapped_as_wav() -> None:
    pcm = b"\x00\x10" * 24000  # one second at 24 kHz

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-goog-api-key"] == "key"
        body = json.loads(request.content)
        assert body["contents"][0]["parts"][0]["text"] == "warm narrator: Hello there"
        assert (
            body["generationConfig"]["speechConfig"]["voiceConfig"]["prebuiltVoiceConfig"]["voiceName"]
            == "Kore"
        )
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "inlineData": {
                                        "mimeType": "audio/L16;codec=pcm;rate=24000",
                                        "data": base64.b64encode(pcm).decode(),
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
        )

    request = AudioGenerationRequest(text="Hello there", voice="Kore", style_prompt="warm narrator")
    output = await gemini_with(handler).generate("gemini-2.5-flash-preview-tts", request)
    assert output.mime_type == "audio/wav" and output.data[:4] == b"RIFF"
    assert output.duration_ms == 1000
    assert output.data == pcm16_to_wav(pcm, sample_rate=24000)


@pytest.mark.parametrize(
    ("status", "text", "expected"),
    [
        (429, '{"error": {"status": "RESOURCE_EXHAUSTED"}}', ProviderErrorCode.QUOTA_EXCEEDED),
        (
            400,
            '{"error": {"message": "API key not valid", "status": "INVALID_ARGUMENT"}}',
            ProviderErrorCode.AUTH_FAILED,
        ),
        (404, "not found", ProviderErrorCode.MODEL_UNAVAILABLE),
        (503, "overloaded", ProviderErrorCode.MODEL_UNAVAILABLE),
    ],
)
async def test_gemini_errors(status: int, text: str, expected: ProviderErrorCode) -> None:
    with pytest.raises(ProviderError) as exc_info:
        await gemini_with(lambda _: httpx.Response(status, text=text)).generate("m", REQUEST)
    assert exc_info.value.code == expected


async def test_gemini_no_audio_is_malformed() -> None:
    with pytest.raises(ProviderError) as exc_info:
        await gemini_with(lambda _: httpx.Response(200, json={"candidates": []})).generate("m", REQUEST)
    assert exc_info.value.code == ProviderErrorCode.MALFORMED_RESPONSE
