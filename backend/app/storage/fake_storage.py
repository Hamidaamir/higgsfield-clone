"""In-memory storage that returns data URLs (tests and `USE_FAKE_PROVIDERS` local mode)."""

import base64
import uuid

from app.core.images import image_dimensions
from app.models import MediaType
from app.storage.base import StorageError, StoredMedia


class FakeStorage:
    name = "fake-storage"

    def __init__(self, *, fail: bool = False, data_urls: bool = True) -> None:
        self.fail = fail
        self.data_urls = data_urls
        self.uploads: list[tuple[str, MediaType, int]] = []

    async def upload(self, data: bytes, *, media_type: MediaType, folder: str, mime_type: str) -> StoredMedia:
        if self.fail:
            raise StorageError("simulated storage failure")
        key = f"{folder}/{uuid.uuid4().hex}"
        self.uploads.append((folder, media_type, len(data)))
        dims = image_dimensions(data) if media_type == MediaType.IMAGE else None
        url = (
            f"data:{mime_type};base64,{base64.b64encode(data).decode()}"
            if self.data_urls
            else f"https://cdn.example.test/{key}.png"
        )
        return StoredMedia(
            provider=self.name,
            key=key,
            url=url,
            thumbnail_url=None if self.data_urls else f"https://cdn.example.test/{key}_thumb.png",
            mime_type=mime_type,
            size_bytes=len(data),
            width=dims[0] if dims else None,
            height=dims[1] if dims else None,
            duration_ms=None,
        )
