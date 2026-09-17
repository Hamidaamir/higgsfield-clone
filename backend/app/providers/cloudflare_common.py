"""Shared plumbing for Cloudflare Workers AI providers (REST base URL, error classification)."""

import contextlib
import logging

import httpx

from app.providers.base import ProviderError, ProviderErrorCode

log = logging.getLogger(__name__)

API_BASE = "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"

# Cloudflare AiError codes observed / documented.
_CONTENT_FLAGGED_CODES = {3030}
_MODEL_MISSING_CODES = {5007, 7000}


def classify_http_error(provider_model: str, response: httpx.Response) -> ProviderError:
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
