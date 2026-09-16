"""Cloudinary-backed media storage (free tier). The SDK is sync, so uploads run in a worker thread."""

import asyncio
import io
import logging
from typing import Any

import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

from app.models import MediaType
from app.storage.base import StorageError, StoredMedia

log = logging.getLogger(__name__)

# Cloudinary treats audio as the "video" resource type.
_RESOURCE_TYPES = {MediaType.IMAGE: "image", MediaType.VIDEO: "video", MediaType.AUDIO: "video"}
UPLOAD_TIMEOUT_S = 60
_FORMAT_MIME = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "mp4": "video/mp4",
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
}


class CloudinaryStorage:
    name = "cloudinary"

    def __init__(self, cloud_name: str, api_key: str, api_secret: str, root_folder: str) -> None:
        cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret, secure=True)
        self._root = root_folder.strip("/")

    async def upload(self, data: bytes, *, media_type: MediaType, folder: str, mime_type: str) -> StoredMedia:
        resource_type = _RESOURCE_TYPES[media_type]
        target_folder = f"{self._root}/{folder.strip('/')}"
        try:
            result: dict[str, Any] = await asyncio.wait_for(
                asyncio.to_thread(
                    cloudinary.uploader.upload,
                    io.BytesIO(data),
                    folder=target_folder,
                    resource_type=resource_type,
                    unique_filename=True,
                    overwrite=False,
                ),
                timeout=UPLOAD_TIMEOUT_S,
            )
        except TimeoutError as exc:
            raise StorageError("cloudinary upload timed out") from exc
        except Exception as exc:  # the SDK raises loosely-typed errors
            log.warning("cloudinary upload failed: %s", type(exc).__name__)
            raise StorageError(f"cloudinary upload failed: {type(exc).__name__}") from exc

        public_id = str(result["public_id"])
        thumbnail_url: str | None = None
        if media_type == MediaType.IMAGE:
            thumbnail_url, _ = cloudinary_url(
                public_id, width=512, crop="limit", quality="auto", fetch_format="auto", secure=True
            )
        duration = result.get("duration")
        # Cloudinary may transcode on upload (e.g. PNG -> JPEG); trust the stored format.
        stored_format = str(result.get("format") or "").lower()
        if stored_format:
            mime_type = _FORMAT_MIME.get(stored_format, f"{resource_type}/{stored_format}")
        return StoredMedia(
            provider=self.name,
            key=public_id,
            url=str(result["secure_url"]),
            thumbnail_url=thumbnail_url,
            mime_type=mime_type,
            size_bytes=int(result.get("bytes", len(data))),
            width=result.get("width"),
            height=result.get("height"),
            duration_ms=int(float(duration) * 1000) if duration else None,
        )
