"""Gemini TTS (Google AI Studio free tier) — selectable fallback provider.

Verified in M0.5: `generateContent` with `responseModalities=["AUDIO"]` returns raw 24 kHz
16-bit PCM (`audio/L16;codec=pcm;rate=24000`), which we wrap into a WAV container.
"""

import base64
import json
import logging
import re

import httpx

from app.core.audio import pcm16_to_wav, wav_duration_ms
from app.providers.base import AudioGenerationRequest, ProviderError, ProviderErrorCode, ProviderOutput

log = logging.getLogger(__name__)

API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
REQUEST_TIMEOUT_S = 90.0
DEFAULT_SAMPLE_RATE = 24000


class GeminiTTSProvider:
    name = "gemini"

    def __init__(self, api_key: str, client: httpx.AsyncClient | None = None) -> None:
        self._headers = {"x-goog-api-key": api_key}
        self._client = client or httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S)

    async def generate(self, provider_model: str, request: AudioGenerationRequest) -> ProviderOutput:
        text = f"{request.style_prompt.strip()}: {request.text}" if request.style_prompt else request.text
        payload = {
            "contents": [{"parts": [{"text": text}]}],
            "generationConfig": {
                "responseModalities": ["AUDIO"],
                "speechConfig": {
                    "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": request.voice or "Kore"}}
                },
            },
        }
        try:
            response = await self._client.post(
                API_URL.format(model=provider_model),
                headers=self._headers,
                json=payload,
                timeout=REQUEST_TIMEOUT_S,
            )
        except httpx.TimeoutException as exc:
            raise ProviderError(ProviderErrorCode.TIMEOUT, f"gemini timeout for {provider_model}") from exc
        except httpx.HTTPError as exc:
            raise ProviderError(ProviderErrorCode.PROVIDER_ERROR, f"gemini transport error: {exc!r}") from exc
        if response.status_code != 200:
            raise _classify(provider_model, response)
        return _parse_success(provider_model, response)


def _parse_success(provider_model: str, response: httpx.Response) -> ProviderOutput:
    try:
        part = response.json()["candidates"][0]["content"]["parts"][0]["inlineData"]
        pcm = base64.b64decode(part["data"])
        mime = str(part.get("mimeType", ""))
    except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise ProviderError(
            ProviderErrorCode.MALFORMED_RESPONSE, f"gemini returned no audio for {provider_model}"
        ) from exc
    if len(pcm) < 100:
        raise ProviderError(
            ProviderErrorCode.MALFORMED_RESPONSE, f"gemini returned empty audio for {provider_model}"
        )
    rate_match = re.search(r"rate=(\d+)", mime)
    sample_rate = int(rate_match.group(1)) if rate_match else DEFAULT_SAMPLE_RATE
    data = pcm16_to_wav(pcm, sample_rate=sample_rate)
    return ProviderOutput(data=data, mime_type="audio/wav", duration_ms=wav_duration_ms(data))


def _classify(provider_model: str, response: httpx.Response) -> ProviderError:
    status = response.status_code
    lowered = response.text[:500].lower()
    log.warning("gemini error model=%s status=%s", provider_model, status)
    if status == 429 or "resource_exhausted" in lowered:
        return ProviderError(ProviderErrorCode.QUOTA_EXCEEDED, "gemini quota/rate limit", retryable=False)
    if status in (401, 403) or "api key" in lowered or "api_key_invalid" in lowered:
        return ProviderError(ProviderErrorCode.AUTH_FAILED, "gemini rejected the api key", retryable=False)
    if status == 404:
        return ProviderError(ProviderErrorCode.MODEL_UNAVAILABLE, f"gemini model missing: {provider_model}")
    if status == 400 and ("safety" in lowered or "blocked" in lowered):
        return ProviderError(ProviderErrorCode.CONTENT_REJECTED, "gemini blocked the text", retryable=False)
    if status >= 500:
        return ProviderError(ProviderErrorCode.MODEL_UNAVAILABLE, f"gemini upstream {status}")
    return ProviderError(ProviderErrorCode.PROVIDER_ERROR, f"gemini error {status}")
