"""Executes queued generations in-process: provider call → storage → assets → final status.

Every transition is persisted so the frontend can poll, and a restart can reconcile.
Jobs are plain asyncio tasks (no external queue); see reconcile_interrupted() for the
restart trade-off.
"""

import asyncio
import logging
import uuid
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import utcnow
from app.db.session import get_session_factory
from app.models import (
    ACTIVE_STATUSES,
    Asset,
    AssetKind,
    Generation,
    GenerationStatus,
    GenerationType,
    MediaType,
)
from app.providers.base import (
    AudioGenerationRequest,
    ImageGenerationRequest,
    ProviderError,
    ProviderErrorCode,
    ProviderOutput,
    VideoGenerationRequest,
)
from app.services.model_registry import ASPECT_RATIO_DIMENSIONS, VIDEO_ASPECT_RATIO_DIMENSIONS, get_model
from app.services.runtime import GenerationRuntime
from app.storage.base import StorageError, StoredMedia

log = logging.getLogger(__name__)

STORAGE_ERROR_CODE = "storage_error"
INTERNAL_ERROR_CODE = "internal_error"
INTERRUPTED_ERROR_CODE = "interrupted"

_MEDIA_TYPES = {
    GenerationType.IMAGE: MediaType.IMAGE,
    GenerationType.VIDEO: MediaType.VIDEO,
    GenerationType.AUDIO: MediaType.AUDIO,
}
_FOLDERS = {GenerationType.IMAGE: "images", GenerationType.VIDEO: "videos", GenerationType.AUDIO: "audio"}


async def run_generation(runtime: GenerationRuntime, generation_id: uuid.UUID) -> None:
    factory = get_session_factory()
    async with factory() as db:
        generation = await db.get(Generation, generation_id)
        if generation is None or generation.status != GenerationStatus.QUEUED:
            return
        generation.status = GenerationStatus.PROCESSING
        generation.started_at = utcnow()
        await db.commit()

        try:
            outputs = await _produce_outputs(runtime, db, generation)
            stored = await _store_outputs(runtime, generation, outputs)
            for output, media in zip(outputs, stored, strict=True):
                db.add(_asset_from_media(generation, media, output))
            generation.status = GenerationStatus.COMPLETED
            log.info(
                "generation completed id=%s type=%s model=%s outputs=%d",
                generation.id,
                generation.type,
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
                "The result was generated but could not be saved. Please try again.",
            )
        except Exception:
            log.exception("generation crashed id=%s", generation.id)
            _mark_failed(
                generation, INTERNAL_ERROR_CODE, "Something went wrong while generating. Please try again."
            )
        generation.completed_at = utcnow()
        await db.commit()


async def _produce_outputs(
    runtime: GenerationRuntime, db: AsyncSession, generation: Generation
) -> list[ProviderOutput]:
    spec = get_model(generation.model_id)
    if spec is None:
        raise ProviderError(
            ProviderErrorCode.MODEL_UNAVAILABLE, f"unknown model {generation.model_id}", retryable=False
        )
    if generation.type == GenerationType.IMAGE:
        return await _generate_images(runtime, generation, spec.provider_model, spec.default_steps)
    if generation.type == GenerationType.VIDEO:
        return [await _generate_video(runtime, db, generation, spec.provider_model)]
    if generation.type == GenerationType.AUDIO:
        return await _generate_audio(runtime, generation, spec.provider, spec.provider_model)
    raise ProviderError(
        ProviderErrorCode.NOT_CONFIGURED, f"no provider for {generation.type}", retryable=False
    )


async def _generate_images(
    runtime: GenerationRuntime, generation: Generation, provider_model: str, default_steps: int | None
) -> list[ProviderOutput]:
    if runtime.image_provider is None:
        raise ProviderError(
            ProviderErrorCode.NOT_CONFIGURED, "image provider not configured", retryable=False
        )
    settings: dict[str, Any] = generation.settings
    width, height = ASPECT_RATIO_DIMENSIONS.get(str(settings.get("aspect_ratio", "1:1")), (1024, 1024))
    batch_size = int(settings.get("batch_size", 1))
    seed = settings.get("seed")
    request = ImageGenerationRequest(
        prompt=generation.prompt,
        width=width,
        height=height,
        steps=default_steps,
        negative_prompt=settings.get("negative_prompt"),
        seed=int(seed) if seed is not None else None,
    )
    # Batch items run concurrently; each is an independent provider call.
    return list(
        await asyncio.gather(
            *(
                runtime.image_provider.generate(provider_model, _with_seed(request, seed, i))
                for i in range(batch_size)
            )
        )
    )


async def _generate_video(
    runtime: GenerationRuntime, db: AsyncSession, generation: Generation, provider_model: str
) -> ProviderOutput:
    if runtime.video_provider is None:
        raise ProviderError(
            ProviderErrorCode.NOT_CONFIGURED, "video provider not configured", retryable=False
        )
    settings: dict[str, Any] = generation.settings
    width, height = VIDEO_ASPECT_RATIO_DIMENSIONS.get(str(settings.get("aspect_ratio", "16:9")), (768, 448))
    seed = settings.get("seed")
    reference_bytes = None
    reference_id = settings.get("reference_asset_id")
    if reference_id:
        reference_bytes = await _load_reference_image(runtime, db, generation, uuid.UUID(str(reference_id)))
    request = VideoGenerationRequest(
        prompt=generation.prompt,
        width=width,
        height=height,
        duration_s=float(settings.get("duration_s", 3)),
        negative_prompt=settings.get("negative_prompt"),
        seed=int(seed) if seed is not None else None,
        reference_image=reference_bytes,
    )
    return await runtime.video_provider.generate(provider_model, request)


async def _generate_audio(
    runtime: GenerationRuntime, generation: Generation, provider_name: str, provider_model: str
) -> list[ProviderOutput]:
    provider = runtime.audio_providers.get(provider_name)
    if provider is None:
        raise ProviderError(
            ProviderErrorCode.NOT_CONFIGURED,
            f"audio provider {provider_name} not configured",
            retryable=False,
        )
    settings: dict[str, Any] = generation.settings
    request = AudioGenerationRequest(
        text=generation.prompt,
        voice=settings.get("voice"),
        language=settings.get("language"),
        style_prompt=settings.get("style_prompt"),
    )
    batch_size = int(settings.get("batch_size", 1))
    return list(
        await asyncio.gather(*(provider.generate(provider_model, request) for _ in range(batch_size)))
    )


async def _load_reference_image(
    runtime: GenerationRuntime, db: AsyncSession, generation: Generation, asset_id: uuid.UUID
) -> bytes:
    """Fetch the user's uploaded reference from object storage (ownership was checked at submit)."""
    asset = (
        await db.execute(select(Asset).where(Asset.id == asset_id, Asset.user_id == generation.user_id))
    ).scalar_one_or_none()
    if asset is None or asset.media_type != MediaType.IMAGE or runtime.storage is None:
        raise ProviderError(ProviderErrorCode.PROVIDER_ERROR, "reference asset missing", retryable=False)
    try:
        return await runtime.storage.fetch(asset.url)
    except StorageError as exc:
        raise ProviderError(ProviderErrorCode.PROVIDER_ERROR, "reference image could not be fetched") from exc


async def _store_outputs(
    runtime: GenerationRuntime, generation: Generation, outputs: list[ProviderOutput]
) -> list[StoredMedia]:
    if runtime.storage is None:
        raise StorageError("media storage not configured")
    media_type = _MEDIA_TYPES[generation.type]
    folder = f"{generation.user_id}/{_FOLDERS[generation.type]}"
    return list(
        await asyncio.gather(
            *(
                runtime.storage.upload(
                    out.data, media_type=media_type, folder=folder, mime_type=out.mime_type
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


def _asset_from_media(generation: Generation, media: StoredMedia, output: ProviderOutput) -> Asset:
    """Storage metadata wins; provider-reported dimensions/duration fill any gaps."""
    return Asset(
        user_id=generation.user_id,
        generation_id=generation.id,
        kind=AssetKind.OUTPUT,
        media_type=_MEDIA_TYPES[generation.type],
        storage_provider=media.provider,
        storage_key=media.key,
        url=media.url,
        thumbnail_url=media.thumbnail_url,
        mime_type=media.mime_type,
        size_bytes=media.size_bytes,
        width=media.width or output.width,
        height=media.height or output.height,
        duration_ms=media.duration_ms or output.duration_ms,
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
