"""Cloudflare Workers AI text-to-speech over the REST API.

Verified in M0.5: MeloTTS answers JSON `{result: {audio: <base64>}}` and the bytes are WAV
(despite the docs saying MP3); Aura-1 streams a real MP3 body and takes a `speaker` name.
"""

import base64
import json
from typing import Any

import httpx

from app.core.audio import sniff_audio
from app.providers.base import AudioGenerationRequest, ProviderError, ProviderErrorCode, ProviderOutput
from app.providers.cloudflare_common import API_BASE, classify_http_error

REQUEST_TIMEOUT_S = 60.0
MELOTTS = "@cf/myshell-ai/melotts"
AURA_1 = "@cf/deepgram/aura-1"


class CloudflareTTSProvider:
    name = "cloudflare"

    def __init__(self, account_id: str, api_token: str, client: httpx.AsyncClient | None = None) -> None:
        self._account_id = account_id
        self._headers = {"Authorization": f"Bearer {api_token}"}
        self._client = client or httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S)

    async def generate(self, provider_model: str, request: AudioGenerationRequest) -> ProviderOutput:
        url = API_BASE.format(account_id=self._account_id, model=provider_model)
        try:
            response = await self._client.post(
                url,
                headers=self._headers,
                json=_build_payload(provider_model, request),
                timeout=REQUEST_TIMEOUT_S,
            )
        except httpx.TimeoutException as exc:
            raise ProviderError(
                ProviderErrorCode.TIMEOUT, f"cloudflare timeout for {provider_model}"
            ) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                ProviderErrorCode.PROVIDER_ERROR, f"cloudflare transport error: {exc!r}"
            ) from exc
        if response.status_code != 200:
            raise classify_http_error(provider_model, response)
        return _parse_success(provider_model, response)


def _build_payload(provider_model: str, request: AudioGenerationRequest) -> dict[str, Any]:
    if provider_model == AURA_1:
        payload: dict[str, Any] = {"text": request.text, "encoding": "mp3"}
        if request.voice:
            payload["speaker"] = request.voice
        return payload
    # MeloTTS: one voice per language; `lang` selects it.
    return {"prompt": request.text, "lang": request.language or "en"}


def _parse_success(provider_model: str, response: httpx.Response) -> ProviderOutput:
    content_type = response.headers.get("content-type", "")
    try:
        if content_type.startswith("application/json"):
            data = base64.b64decode(response.json()["result"]["audio"])
        else:
            data = response.content
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise ProviderError(
            ProviderErrorCode.MALFORMED_RESPONSE,
            f"unparseable cloudflare audio response for {provider_model}",
        ) from exc
    info = sniff_audio(data) if len(data) >= 100 else None
    if info is None:
        raise ProviderError(
            ProviderErrorCode.MALFORMED_RESPONSE, f"empty or unknown audio from {provider_model}"
        )
    return ProviderOutput(data=data, mime_type=info.mime_type, duration_ms=info.duration_ms)
