"""Deterministic in-process video provider for tests and `USE_FAKE_PROVIDERS` local mode.

Returns a tiny synthetic WebM clip (rendered with Pillow + ffmpeg once, checked in as a
fixture) so browser tests can exercise real playback without any provider quota.
"""

import asyncio
from pathlib import Path

from app.providers.base import ProviderError, ProviderErrorCode, ProviderOutput, VideoGenerationRequest
from app.providers.fake_image import FAIL_MARKER, SLOW_MARKER

FIXTURE_PATH = Path(__file__).with_name("fixtures") / "fake-video.webm"
QUOTA_MARKER = "[quota]"  # prompts containing this token simulate ZeroGPU quota exhaustion


class FakeVideoProvider:
    name = "fake"

    def __init__(self, *, latency_s: float = 0.0, fail_with: ProviderErrorCode | None = None) -> None:
        self.latency_s = latency_s
        self.fail_with = fail_with
        self.calls: list[tuple[str, VideoGenerationRequest]] = []
        self._fixture = FIXTURE_PATH.read_bytes()

    async def generate(self, provider_model: str, request: VideoGenerationRequest) -> ProviderOutput:
        self.calls.append((provider_model, request))
        if self.latency_s:
            await asyncio.sleep(self.latency_s)
        lowered = request.prompt.lower()
        if SLOW_MARKER in lowered:
            await asyncio.sleep(8)
        if self.fail_with is not None:
            raise ProviderError(self.fail_with, "simulated provider failure")
        if QUOTA_MARKER in lowered:
            from app.providers.base import VIDEO_QUOTA_MESSAGE

            raise ProviderError(
                ProviderErrorCode.QUOTA_EXCEEDED,
                "simulated quota",
                retryable=False,
                user_message=VIDEO_QUOTA_MESSAGE,
            )
        if FAIL_MARKER in lowered:
            raise ProviderError(ProviderErrorCode.PROVIDER_ERROR, "simulated provider failure")
        return ProviderOutput(
            data=self._fixture,
            mime_type="video/webm",
            width=192,
            height=108,
            duration_ms=int(request.duration_s * 1000),
        )
