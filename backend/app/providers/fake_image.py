"""Deterministic in-process image provider for tests and local UI work.

Enabled with `USE_FAKE_PROVIDERS=1` so the frontend can be exercised end-to-end without
spending real (quota-limited) provider calls. Never enabled in production.
"""

import asyncio
import hashlib
import io

from PIL import Image, ImageDraw

from app.providers.base import ImageGenerationRequest, ProviderError, ProviderErrorCode, ProviderOutput

FAIL_MARKER = "[fail]"  # prompts containing this token simulate a provider failure


def render_placeholder(prompt: str, width: int, height: int) -> bytes:
    """A prompt-seeded gradient PNG so results are visibly distinct in the UI."""
    digest = hashlib.sha256(prompt.encode()).digest()
    top = tuple(digest[0:3])
    bottom = tuple(digest[3:6])
    image = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(image)
    for y in range(height):
        t = y / max(1, height - 1)
        color = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color)
    draw.rectangle([12, 12, width - 12, height - 12], outline=(214, 255, 0), width=4)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


class FakeImageProvider:
    name = "fake"

    def __init__(self, *, latency_s: float = 0.0, fail_with: ProviderErrorCode | None = None) -> None:
        self.latency_s = latency_s
        self.fail_with = fail_with
        self.calls: list[tuple[str, ImageGenerationRequest]] = []

    async def generate(self, provider_model: str, request: ImageGenerationRequest) -> ProviderOutput:
        self.calls.append((provider_model, request))
        if self.latency_s:
            await asyncio.sleep(self.latency_s)
        if self.fail_with is not None:
            raise ProviderError(self.fail_with, "simulated provider failure")
        if FAIL_MARKER in request.prompt.lower():
            raise ProviderError(
                ProviderErrorCode.CONTENT_REJECTED, "simulated safety rejection", retryable=False
            )
        # Keep dev placeholders small so data-URL storage stays light.
        width, height = _scaled(request.width, request.height, 256)
        data = render_placeholder(request.prompt, width, height)
        return ProviderOutput(data=data, mime_type="image/png", width=width, height=height)


def _scaled(width: int, height: int, longest: int) -> tuple[int, int]:
    scale = longest / max(width, height)
    return max(8, int(width * scale)), max(8, int(height * scale))
