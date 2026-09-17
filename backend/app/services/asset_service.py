"""User uploads (reference images). Bytes go to object storage; Postgres keeps metadata only."""

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ServiceUnavailableError, ValidationError
from app.core.images import image_dimensions
from app.models import Asset, AssetKind, MediaType, User
from app.services.runtime import GenerationRuntime
from app.storage.base import StorageError

log = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_UPLOAD_PIXELS = 4096
ALLOWED_IMAGE_MIME = {"image/png", "image/jpeg", "image/webp"}


async def upload_reference_image(
    db: AsyncSession, runtime: GenerationRuntime, user: User, data: bytes, declared_type: str | None
) -> Asset:
    if not data:
        raise ValidationError("The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValidationError("Images must be 10 MB or smaller.")
    dims = image_dimensions(data)  # sniffed from bytes; the declared MIME is never trusted
    if dims is None or dims[2] not in ALLOWED_IMAGE_MIME:
        raise ValidationError("Upload a PNG, JPEG or WebP image.")
    width, height, mime_type = dims
    if max(width, height) > MAX_UPLOAD_PIXELS:
        raise ValidationError(f"Images must be at most {MAX_UPLOAD_PIXELS}px on the longest side.")
    if declared_type and declared_type not in ALLOWED_IMAGE_MIME:
        log.info("upload declared type %s ignored; sniffed %s", declared_type, mime_type)
    if runtime.storage is None:
        raise ServiceUnavailableError("Media storage is not configured.")
    try:
        stored = await runtime.storage.upload(
            data, media_type=MediaType.IMAGE, folder=f"{user.id}/uploads", mime_type=mime_type
        )
    except StorageError as exc:
        raise ServiceUnavailableError("The image could not be stored. Please try again.") from exc
    asset = Asset(
        user_id=user.id,
        generation_id=None,
        kind=AssetKind.INPUT,
        media_type=MediaType.IMAGE,
        storage_provider=stored.provider,
        storage_key=stored.key,
        url=stored.url,
        thumbnail_url=stored.thumbnail_url,
        mime_type=stored.mime_type,
        size_bytes=stored.size_bytes,
        width=stored.width or width,
        height=stored.height or height,
        metadata_={"source": "upload"},
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


async def get_owned_asset(db: AsyncSession, user: User, asset_id: uuid.UUID) -> Asset:
    """An asset the caller owns; anything else is a 404 so ids can't be probed."""
    asset = (
        await db.execute(select(Asset).where(Asset.id == asset_id, Asset.user_id == user.id))
    ).scalar_one_or_none()
    if asset is None:
        raise NotFoundError("Asset not found.")
    return asset
