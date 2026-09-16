"""Object-storage contract. Generated media bytes go here; Postgres keeps only references."""

from dataclasses import dataclass
from typing import Protocol

from app.models import MediaType


class StorageError(Exception):
    """Persisting media failed; the owning generation must be marked failed, never completed."""


@dataclass(frozen=True)
class StoredMedia:
    provider: str
    key: str
    url: str
    thumbnail_url: str | None
    mime_type: str
    size_bytes: int
    width: int | None
    height: int | None
    duration_ms: int | None


class MediaStorage(Protocol):
    name: str

    async def upload(self, data: bytes, *, media_type: MediaType, folder: str, mime_type: str) -> StoredMedia:
        """Store bytes and return a durable public reference."""
        ...
