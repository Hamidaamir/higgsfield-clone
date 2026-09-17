"""In-memory storage for tests and `USE_FAKE_PROVIDERS` local mode.

Bytes stay in a dict; in fake mode the dev-only `/api/dev-assets/{key}` route serves
them so the browser can render images, video and audio exactly like real CDN URLs.
"""

import uuid

from app.core.images import image_dimensions
from app.models import MediaType
from app.storage.base import StorageError, StoredMedia

DEV_ASSET_ROUTE = "/api/dev-assets"


class FakeStorage:
    name = "fake-storage"

    def __init__(self, *, fail: bool = False, serve_locally: bool = True) -> None:
        self.fail = fail
        self.serve_locally = serve_locally
        self.uploads: list[tuple[str, MediaType, int]] = []
        self.blobs: dict[str, tuple[bytes, str]] = {}
        self._by_url: dict[str, str] = {}

    async def fetch(self, url: str) -> bytes:
        key = self._by_url.get(url)
        if key is None:
            raise StorageError("unknown fake asset url")
        return self.blobs[key][0]

    async def upload(self, data: bytes, *, media_type: MediaType, folder: str, mime_type: str) -> StoredMedia:
        if self.fail:
            raise StorageError("simulated storage failure")
        key = uuid.uuid4().hex
        self.uploads.append((folder, media_type, len(data)))
        dims = image_dimensions(data) if media_type == MediaType.IMAGE else None
        url = f"{DEV_ASSET_ROUTE}/{key}" if self.serve_locally else f"https://cdn.example.test/{folder}/{key}"
        self.blobs[key] = (data, mime_type)
        self._by_url[url] = key
        return StoredMedia(
            provider=self.name,
            key=f"{folder}/{key}",
            url=url,
            thumbnail_url=None if self.serve_locally else f"{url}_thumb",
            mime_type=mime_type,
            size_bytes=len(data),
            width=dims[0] if dims else None,
            height=dims[1] if dims else None,
            duration_ms=None,
        )
