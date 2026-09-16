"""Executes queued generations in-process: provider call → storage → assets → final status.

Every transition is persisted so the frontend can poll, and a restart can reconcile.
"""

import asyncio
import logging
import uuid
from typing import Any

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import utcnow
from app.db.session import get_session_factory
from app.models import (
    ACTIVE_STATUSES,
    Asset,
    AssetKind,
    Generation,
    GenerationStatus,
    MediaType,
)
from app.providers.base import ImageGenerationRequest, ProviderError, ProviderErrorCode, ProviderOutput
from app.services.model_registry import ASPECT_RATIO_DIMENSIONS, get_model
from app.services.runtime import GenerationRuntime
from app.storage.base import StorageError, StoredMedia

log = logging.getLogger(__name__)

STORAGE_ERROR_CODE = "storage_error"
INTERNAL_ERROR_CODE = "internal_error"
INTERRUPTED_ERROR_CODE = "interrupted"


async def run_image_generation(runtime: GenerationRuntime, generation_id: uuid.UUID) -> None:
    factory = get_session_factory()
    async with factory() as db:
        generation = await db.get(Generation, generation_id)
        if generation is None or generation.status != GenerationStatus.QUEUED:
            return
        generation.status = GenerationStatus.PROCESSING
        generation.started_at = utcnow()
        await db.commit()

        try:
            stored = await _generate_and_store(runtime, generation)
            for media in stored:
                db.add(_asset_from_media(generation, media))
            generation.status = GenerationStatus.COMPLETED
            log.info(
                "generation completed id=%s model=%s outputs=%d",
                generation.id,
                generation.model_id,
                len(stored),
            )
        except ProviderError as exc:
            log.warning("generation failed id=%s code=%s detail=%s", generation.id, exc.code, exc.message)
            _mark_failed(generation, exc.code.value, exc.user_message)
        except StorageError as exc:
            log.error("generation storage failed id=%s detail=%s", generation.id, exc)
            _mark_failed(
                generation,
                STORAGE_ERROR_CODE,
                "The image was generated but could not be saved. Please try again.",
            )
        except Exception:
            log.exception("generation crashed id=%s", generation.id)
            _mark_failed(
                generation, INTERNAL_ERROR_CODE, "Something went wrong while generating. Please try again."
            )
        generation.completed_at = utcnow()
        await db.commit()


async def _generate_and_store(runtime: GenerationRuntime, generation: Generation) -> list[StoredMedia]:
    if runtime.image_provider is None or runtime.storage is None:
        raise ProviderError(
            ProviderErrorCode.NOT_CONFIGURED, "image provider or storage not configured", retryable=False
        )
    spec = get_model(generation.model_id)
    if spec is None:
        raise ProviderError(
            ProviderErrorCode.MODEL_UNAVAILABLE, f"unknown model {generation.model_id}", retryable=False
        )

    settings: dict[str, Any] = generation.settings
    width, height = ASPECT_RATIO_DIMENSIONS.get(str(settings.get("aspect_ratio", "1:1")), (1024, 1024))
    batch_size = int(settings.get("batch_size", 1))
    seed = settings.get("seed")
    request = ImageGenerationRequest(
        prompt=generation.prompt,
        width=width,
        height=height,
        steps=spec.default_steps,
        negative_prompt=settings.get("negative_prompt"),
        seed=int(seed) if seed is not None else None,
    )
    # Batch items run concurrently; each is an independent provider call.
    outputs: list[ProviderOutput] = await asyncio.gather(
        *(
            runtime.image_provider.generate(spec.provider_model, _with_seed(request, seed, i))
            for i in range(batch_size)
        )
    )
    folder = f"{generation.user_id}/images"
    return list(
        await asyncio.gather(
            *(
                runtime.storage.upload(
                    out.data, media_type=MediaType.IMAGE, folder=folder, mime_type=out.mime_type
                )
                for out in outputs
            )
        )
    )


def _with_seed(request: ImageGenerationRequest, seed: Any, index: int) -> ImageGenerationRequest:
    if seed is None or index == 0:
        return request
    return ImageGenerationRequest(
        prompt=request.prompt,
        width=request.width,
        height=request.height,
        steps=request.steps,
        negative_prompt=request.negative_prompt,
        seed=(int(seed) + index) % (2**31 - 1),
        reference_image=request.reference_image,
    )


def _asset_from_media(generation: Generation, media: StoredMedia) -> Asset:
    return Asset(
        user_id=generation.user_id,
        generation_id=generation.id,
        kind=AssetKind.OUTPUT,
        media_type=MediaType.IMAGE,
        storage_provider=media.provider,
        storage_key=media.key,
        url=media.url,
        thumbnail_url=media.thumbnail_url,
        mime_type=media.mime_type,
        size_bytes=media.size_bytes,
        width=media.width,
        height=media.height,
        duration_ms=media.duration_ms,
        metadata_={"model_id": generation.model_id},
    )


def _mark_failed(generation: Generation, code: str, user_message: str) -> None:
    generation.status = GenerationStatus.FAILED
    generation.error_code = code
    generation.error_message = user_message


async def reconcile_interrupted(db: AsyncSession) -> int:
    """Jobs run in-process, so anything still active after a restart can never finish."""
    result = await db.execute(
        update(Generation)
        .where(Generation.status.in_(ACTIVE_STATUSES))
        .values(
            status=GenerationStatus.FAILED,
            error_code=INTERRUPTED_ERROR_CODE,
            error_message="The server restarted before this generation finished. Please try again.",
            completed_at=utcnow(),
        )
        .returning(Generation.id)
    )
    ids = result.scalars().all()
    await db.commit()
    if ids:
        log.warning("marked %d interrupted generations as failed", len(ids))
    return len(ids)
