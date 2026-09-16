"""Cloudflare Workers AI image models over the REST API.

Verified in M0.5: flux-1-schnell (JSON, base64 result), stable-diffusion-xl-lightning
and lucid-origin (JSON in, binary PNG out), flux-2-klein-4b (multipart in, base64 out).
"""

import base64
import contextlib
import json
import logging
from typing import Any

import httpx

from app.core.images import image_dimensions
from app.providers.base import ImageGenerationRequest, ProviderError, ProviderErrorCode, ProviderOutput

log = logging.getLogger(__name__)

API_BASE = "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
REQUEST_TIMEOUT_S = 90.0

# Cloudflare AiError codes observed / documented.
_CONTENT_FLAGGED_CODES = {3030}
_MODEL_MISSING_CODES = {5007, 7000}


class CloudflareImageProvider:
    name = "cloudflare"

    def __init__(self, account_id: str, api_token: str, client: httpx.AsyncClient | None = None) -> None:
        self._account_id = account_id
        self._headers = {"Authorization": f"Bearer {api_token}"}
        self._client = client or httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S)

    async def generate(self, provider_model: str, request: ImageGenerationRequest) -> ProviderOutput:
        url = API_BASE.format(account_id=self._account_id, model=provider_model)
        try:
            if provider_model.endswith("flux-2-klein-4b"):
                response = await self._client.post(
                    url, headers=self._headers, **_build_multipart(request), timeout=REQUEST_TIMEOUT_S
                )
            else:
                response = await self._client.post(
                    url,
                    headers=self._headers,
                    json=_build_json(provider_model, request),
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
            raise _classify_http_error(provider_model, response)
        return _parse_success(provider_model, response)


def _build_json(provider_model: str, request: ImageGenerationRequest) -> dict[str, Any]:
    if provider_model.endswith("flux-1-schnell"):
        # Fixed 1024x1024 output; only prompt/steps/seed are accepted.
        payload: dict[str, Any] = {"prompt": request.prompt, "steps": min(request.steps or 4, 8)}
    elif provider_model.endswith("stable-diffusion-xl-lightning"):
        payload = {
            "prompt": request.prompt,
            "width": request.width,
            "height": request.height,
            "num_steps": min(request.steps or 8, 20),
        }
        if request.negative_prompt:
            payload["negative_prompt"] = request.negative_prompt
    else:  # lucid-origin and other width/height models
        payload = {
            "prompt": request.prompt,
            "width": request.width,
            "height": request.height,
            "num_steps": min(request.steps or 20, 40),
        }
    if request.seed is not None:
        payload["seed"] = request.seed
    return payload


def _build_multipart(request: ImageGenerationRequest) -> dict[str, Any]:
    data = {"prompt": request.prompt, "width": str(request.width), "height": str(request.height)}
    if request.steps:
        data["steps"] = str(request.steps)
    if request.seed is not None:
        data["seed"] = str(request.seed)
    files: dict[str, Any] = {}
    if request.reference_image:
        files["image"] = ("reference.png", request.reference_image, "image/png")
    else:
        # httpx only sends multipart/form-data when `files` is present.
        files["_"] = ("", b"")
    return {"data": data, "files": files}


def _parse_success(provider_model: str, response: httpx.Response) -> ProviderOutput:
    content_type = response.headers.get("content-type", "")
    try:
        if content_type.startswith("application/json"):
            body = response.json()
            data = base64.b64decode(body["result"]["image"])
        else:
            data = response.content
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise ProviderError(
            ProviderErrorCode.MALFORMED_RESPONSE, f"unparseable cloudflare response for {provider_model}"
        ) from exc
    if len(data) < 100:
        raise ProviderError(ProviderErrorCode.MALFORMED_RESPONSE, f"empty image from {provider_model}")
    dims = image_dimensions(data)
    if dims is None:
        raise ProviderError(ProviderErrorCode.MALFORMED_RESPONSE, f"undecodable image from {provider_model}")
    width, height, mime_type = dims
    return ProviderOutput(data=data, mime_type=mime_type, width=width, height=height)


def _classify_http_error(provider_model: str, response: httpx.Response) -> ProviderError:
    status = response.status_code
    text = response.text[:500]
    codes: set[int] = set()
    with contextlib.suppress(ValueError, AttributeError):
        codes = {int(err.get("code", 0)) for err in response.json().get("errors", [])}
    lowered = text.lower()
    log.warning("cloudflare error model=%s status=%s codes=%s", provider_model, status, sorted(codes))

    if status == 429 or "rate limit" in lowered:
        return ProviderError(ProviderErrorCode.RATE_LIMITED, f"cloudflare 429 for {provider_model}")
    if status in (402, 403) or "quota" in lowered or "neuron" in lowered or "limit exceeded" in lowered:
        return ProviderError(
            ProviderErrorCode.QUOTA_EXCEEDED, f"cloudflare quota/plan error {status}", retryable=False
        )
    if codes & _CONTENT_FLAGGED_CODES or "flagged" in lowered:
        return ProviderError(
            ProviderErrorCode.CONTENT_REJECTED, "cloudflare flagged the output", retryable=False
        )
    if status == 404 or codes & _MODEL_MISSING_CODES or "no such model" in lowered:
        return ProviderError(
            ProviderErrorCode.MODEL_UNAVAILABLE, f"cloudflare model missing: {provider_model}"
        )
    if status in (502, 503, 504):
        return ProviderError(ProviderErrorCode.MODEL_UNAVAILABLE, f"cloudflare upstream {status}")
    return ProviderError(ProviderErrorCode.PROVIDER_ERROR, f"cloudflare error {status}: {text[:200]}")
