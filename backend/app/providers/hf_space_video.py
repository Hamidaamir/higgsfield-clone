"""LTX-Video through a public Hugging Face ZeroGPU Space, driven by `gradio_client`.

Verified in M0.5 (docs/provider-spikes.md). The Gradio client is synchronous, so each
generation runs in a worker thread; the job runner awaits it without blocking the loop.
The daily ZeroGPU quota belongs to the caller's HF account and is enforced by the Space.
"""

import asyncio
import contextlib
import logging
import os
import re
import tempfile
import threading
from pathlib import Path
from typing import Any

from app.providers.base import (
    VIDEO_QUOTA_MESSAGE,
    ProviderError,
    ProviderErrorCode,
    ProviderOutput,
    VideoGenerationRequest,
)

log = logging.getLogger(__name__)

GENERATION_TIMEOUT_S = 600.0
DEFAULT_NEGATIVE_PROMPT = "worst quality, inconsistent motion, blurry, jittery, distorted"
_QUOTA_PATTERNS = ("zerogpu quota", "gpu quota", "exceeded your", "quota")
_AUTH_PATTERNS = ("401", "unauthorized", "invalid token", "invalid credentials", "authentication")
_SLEEPING_PATTERNS = ("sleeping", "paused", "not running", "space is", "503", "502", "starting")


class HFSpaceVideoProvider:
    """`provider_model` is the Space id (e.g. `Lightricks/ltx-video-distilled`), owned by the registry."""

    name = "hf-space"

    def __init__(self, token: str | None) -> None:
        self._token = token
        self._clients: dict[str, Any] = {}
        self._lock = threading.Lock()

    async def generate(self, provider_model: str, request: VideoGenerationRequest) -> ProviderOutput:
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(self._generate_blocking, provider_model, request),
                timeout=GENERATION_TIMEOUT_S,
            )
        except TimeoutError as exc:
            raise ProviderError(ProviderErrorCode.TIMEOUT, f"hf space timeout for {provider_model}") from exc

    # ---- blocking section (runs in a worker thread) ---------------------------------

    def _client(self, space: str) -> Any:
        from gradio_client import Client

        with self._lock:
            client = self._clients.get(space)
            if client is None:
                try:
                    client = Client(space, token=self._token, verbose=False)
                except Exception as exc:
                    raise _classify(exc, f"connecting to {space}") from exc
                self._clients[space] = client
            return client

    def _generate_blocking(self, space: str, request: VideoGenerationRequest) -> ProviderOutput:
        from gradio_client import handle_file

        client = self._client(space)
        params: dict[str, Any] = {
            "prompt": request.prompt,
            "negative_prompt": request.negative_prompt or DEFAULT_NEGATIVE_PROMPT,
            "input_image_filepath": None,
            "input_video_filepath": None,
            "height_ui": request.height,
            "width_ui": request.width,
            "mode": "text-to-video",
            "duration_ui": request.duration_s,
            "ui_frames_to_use": 9,
            "seed_ui": request.seed if request.seed is not None else 42,
            "randomize_seed": request.seed is None,
            "ui_guidance_scale": 1,
            "improve_texture_flag": True,
        }
        api_name = "/text_to_video"
        reference_path: str | None = None
        if request.reference_image:
            reference_path = _write_temp(request.reference_image, ".png")
            params["input_image_filepath"] = handle_file(reference_path)
            params["mode"] = "image-to-video"
            api_name = "/image_to_video"

        try:
            result = client.predict(**params, api_name=api_name)
        except Exception as exc:
            # Drop a client that errored so the next call reconnects (Space may have restarted).
            with self._lock:
                self._clients.pop(space, None)
            raise _classify(exc, f"predict on {space}") from exc
        finally:
            if reference_path:
                _remove_quiet(reference_path)

        return _read_output(result)


def _write_temp(data: bytes, suffix: str) -> str:
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
    return path


def _remove_quiet(path: str) -> None:
    with contextlib.suppress(OSError):
        os.remove(path)


def _read_output(result: Any) -> ProviderOutput:
    """The Space returns ((video: path, subtitles: None), seed). The temp file is removed after reading."""
    first = result[0] if isinstance(result, list | tuple) and result else result
    path = first.get("video") if isinstance(first, dict) else first
    if not isinstance(path, str) or not path:
        raise ProviderError(ProviderErrorCode.MALFORMED_RESPONSE, "hf space returned no video file")
    try:
        data = Path(path).read_bytes()
    except OSError as exc:
        raise ProviderError(ProviderErrorCode.MALFORMED_RESPONSE, "hf space video file unreadable") from exc
    finally:
        _remove_quiet(path)
    if len(data) < 1000 or data[4:8] != b"ftyp":
        raise ProviderError(ProviderErrorCode.MALFORMED_RESPONSE, "hf space output is not an MP4")
    return ProviderOutput(data=data, mime_type="video/mp4")


def _classify(exc: Exception, context: str) -> ProviderError:
    text = str(exc)
    lowered = text.lower()
    log.warning("hf space error while %s: %s: %s", context, type(exc).__name__, _redact(text)[:300])
    if any(p in lowered for p in _QUOTA_PATTERNS):
        return ProviderError(
            ProviderErrorCode.QUOTA_EXCEEDED,
            "zerogpu quota exhausted",
            retryable=False,
            user_message=VIDEO_QUOTA_MESSAGE,
        )
    if any(p in lowered for p in _AUTH_PATTERNS):
        return ProviderError(ProviderErrorCode.AUTH_FAILED, "hf token rejected", retryable=False)
    if "timed out" in lowered or "timeout" in lowered:
        return ProviderError(ProviderErrorCode.TIMEOUT, "hf space timed out")
    if any(p in lowered for p in _SLEEPING_PATTERNS) or "could not fetch config" in lowered:
        return ProviderError(ProviderErrorCode.MODEL_UNAVAILABLE, "hf space unavailable")
    if "queue" in lowered and ("full" in lowered or "rejected" in lowered):
        return ProviderError(ProviderErrorCode.RATE_LIMITED, "hf space queue rejected the request")
    return ProviderError(ProviderErrorCode.PROVIDER_ERROR, f"hf space failed: {type(exc).__name__}")


def _redact(text: str) -> str:
    """Never let a token leak into logs even if a library echoes headers."""
    return re.sub(r"hf_[A-Za-z0-9]{10,}", "hf_[redacted]", text)
