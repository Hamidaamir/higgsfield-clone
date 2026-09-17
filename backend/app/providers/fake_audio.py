"""Deterministic in-process TTS provider for tests and `USE_FAKE_PROVIDERS` local mode.

Synthesizes a short WAV tone (length scales with the text) with Python's `wave` module, so
there is no binary fixture and browser tests get genuinely playable audio without quota.
"""

import asyncio
import io
import math
import wave

from app.providers.base import (
    AUDIO_QUOTA_MESSAGE,
    AudioGenerationRequest,
    ProviderError,
    ProviderErrorCode,
    ProviderOutput,
)
from app.providers.fake_image import FAIL_MARKER, SLOW_MARKER
from app.providers.fake_video import QUOTA_MARKER

SAMPLE_RATE = 8000
MAX_SECONDS = 6.0


def render_tone(text: str, voice: str | None) -> bytes:
    """~0.06 s per character of a soft sine tone whose pitch depends on the voice name."""
    seconds = max(0.6, min(MAX_SECONDS, len(text) * 0.06))
    pitch = 220 + (sum(map(ord, voice or "default")) % 200)
    frames = bytearray()
    total = int(seconds * SAMPLE_RATE)
    for i in range(total):
        envelope = min(1.0, i / 400, (total - i) / 400)
        sample = int(12000 * envelope * math.sin(2 * math.pi * pitch * i / SAMPLE_RATE))
        frames += sample.to_bytes(2, "little", signed=True)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        handle.writeframes(bytes(frames))
    return buffer.getvalue()


class FakeAudioProvider:
    name = "fake"

    def __init__(self, *, latency_s: float = 0.0, fail_with: ProviderErrorCode | None = None) -> None:
        self.latency_s = latency_s
        self.fail_with = fail_with
        self.calls: list[tuple[str, AudioGenerationRequest]] = []

    async def generate(self, provider_model: str, request: AudioGenerationRequest) -> ProviderOutput:
        self.calls.append((provider_model, request))
        if self.latency_s:
            await asyncio.sleep(self.latency_s)
        lowered = request.text.lower()
        if SLOW_MARKER in lowered:
            await asyncio.sleep(8)
        if self.fail_with is not None:
            raise ProviderError(self.fail_with, "simulated provider failure")
        if QUOTA_MARKER in lowered:
            raise ProviderError(
                ProviderErrorCode.QUOTA_EXCEEDED,
                "simulated quota",
                retryable=False,
                user_message=AUDIO_QUOTA_MESSAGE,
            )
        if FAIL_MARKER in lowered:
            raise ProviderError(ProviderErrorCode.PROVIDER_ERROR, "simulated provider failure")
        data = render_tone(request.text, request.voice)
        seconds = (len(data) - 44) / (SAMPLE_RATE * 2)
        return ProviderOutput(data=data, mime_type="audio/wav", duration_ms=int(seconds * 1000))
