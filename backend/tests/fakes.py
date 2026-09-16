"""Fake provider/storage implementations so tests never touch real (quota-limited) services."""

import io
import uuid

from PIL import Image

from app.models import MediaType
from app.providers.base import ImageGenerationRequest, ProviderError, ProviderErrorCode, ProviderOutput
from app.storage.base import StorageError, StoredMedia


def png_bytes(width: int = 64, height: int = 64) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), (214, 255, 0)).save(buffer, format="PNG")
    return buffer.getvalue()


class FakeImageProvider:
    name = "fake"

    def __init__(self, *, fail_with: ProviderErrorCode | None = None) -> None:
        self.fail_with = fail_with
        self.calls: list[tuple[str, ImageGenerationRequest]] = []

    async def generate(self, provider_model: str, request: ImageGenerationRequest) -> ProviderOutput:
        self.calls.append((provider_model, request))
        if self.fail_with is not None:
            raise ProviderError(self.fail_with, "simulated provider failure")
        data = png_bytes(request.width, request.height)
        return ProviderOutput(data=data, mime_type="image/png", width=request.width, height=request.height)


class FakeStorage:
    name = "fake-storage"

    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail
        self.uploads: list[tuple[str, MediaType, int]] = []

    async def upload(self, data: bytes, *, media_type: MediaType, folder: str, mime_type: str) -> StoredMedia:
        if self.fail:
            raise StorageError("simulated storage failure")
        key = f"{folder}/{uuid.uuid4().hex}"
        self.uploads.append((folder, media_type, len(data)))
        return StoredMedia(
            provider=self.name,
            key=key,
            url=f"https://cdn.example.test/{key}.png",
            thumbnail_url=f"https://cdn.example.test/{key}_thumb.png",
            mime_type=mime_type,
            size_bytes=len(data),
            width=64,
            height=64,
            duration_ms=None,
        )
