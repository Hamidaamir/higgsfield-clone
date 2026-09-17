"""Generation use-cases: validate against the model registry, persist, enqueue, read back with ownership."""

import base64
import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.core.ratelimit import GLOBAL_KEY, audio_user_limiter, video_global_limiter, video_user_limiter
from app.models import ACTIVE_STATUSES, Asset, Generation, GenerationStatus, GenerationType, MediaType, User
from app.schemas.generation import AudioGenerationCreate, ImageGenerationCreate, VideoGenerationCreate
from app.services import job_runner
from app.services.model_registry import ModelSpec, get_model
from app.services.runtime import GenerationRuntime

DEFAULT_PAGE_SIZE = 24
MAX_PAGE_SIZE = 60


def _field_error(message: str, field: str, detail: str) -> ValidationError:
    return ValidationError(message, details={"fields": [{"field": field, "message": detail}]})


def _require_model(model_id: str, model_type: GenerationType) -> ModelSpec:
    spec = get_model(model_id, model_type)
    if spec is None:
        raise _field_error(f"Unknown {model_type.value} model.", "model_id", "Unsupported model.")
    return spec


def _check_aspect_ratio(spec: ModelSpec, aspect_ratio: str) -> None:
    if aspect_ratio not in spec.aspect_ratios:
        raise _field_error(
            f"{spec.name} does not support the {aspect_ratio} aspect ratio.",
            "aspect_ratio",
            f"Supported: {', '.join(spec.aspect_ratios)}",
        )


async def create_image_generation(
    db: AsyncSession, runtime: GenerationRuntime, user: User, payload: ImageGenerationCreate
) -> Generation:
    spec = _require_model(payload.model_id, GenerationType.IMAGE)
    _check_aspect_ratio(spec, payload.aspect_ratio)
    if payload.batch_size > spec.max_batch:
        raise _field_error(
            f"{spec.name} supports at most {spec.max_batch} images per generation.",
            "batch_size",
            f"Maximum {spec.max_batch}",
        )
    settings: dict[str, object] = {"aspect_ratio": payload.aspect_ratio, "batch_size": payload.batch_size}
    if payload.negative_prompt and spec.supports_negative_prompt:
        settings["negative_prompt"] = payload.negative_prompt
    if payload.seed is not None:
        settings["seed"] = payload.seed
    if payload.reference_asset_id is not None:
        if not spec.supports_reference_image:
            raise _field_error(
                f"{spec.name} does not support reference images.", "reference_asset_id", "Unsupported."
            )
        await _require_owned_image_asset(db, user, payload.reference_asset_id)
        settings["reference_asset_id"] = str(payload.reference_asset_id)
    return await _enqueue(
        db, runtime, user, spec, payload.prompt, settings, credit_cost=spec.credit_cost * payload.batch_size
    )


async def create_video_generation(
    db: AsyncSession, runtime: GenerationRuntime, user: User, payload: VideoGenerationCreate
) -> Generation:
    spec = _require_model(payload.model_id, GenerationType.VIDEO)
    _check_aspect_ratio(spec, payload.aspect_ratio)
    if payload.duration_s not in spec.durations_s:
        raise _field_error(
            f"{spec.name} supports clip lengths of {', '.join(f'{d}s' for d in spec.durations_s)}.",
            "duration_s",
            f"Supported: {', '.join(str(d) for d in spec.durations_s)}",
        )
    settings: dict[str, object] = {"aspect_ratio": payload.aspect_ratio, "duration_s": payload.duration_s}
    if payload.negative_prompt and spec.supports_negative_prompt:
        settings["negative_prompt"] = payload.negative_prompt
    if payload.seed is not None:
        settings["seed"] = payload.seed
    if payload.reference_asset_id is not None:
        if not spec.supports_reference_image:
            raise _field_error(
                f"{spec.name} does not support reference images.", "reference_asset_id", "Unsupported."
            )
        await _require_owned_image_asset(db, user, payload.reference_asset_id)
        settings["reference_asset_id"] = str(payload.reference_asset_id)

    # The video provider's daily GPU quota is shared by everyone on this deployment:
    # one in-flight clip per user, plus per-user and process-wide submission caps.
    await _reject_if_video_in_flight(db, user)
    video_user_limiter.check(str(user.id), what="video generations")
    video_global_limiter.check(GLOBAL_KEY, what="video generations across the app")
    return await _enqueue(db, runtime, user, spec, payload.prompt, settings, credit_cost=spec.credit_cost)


async def create_audio_generation(
    db: AsyncSession, runtime: GenerationRuntime, user: User, payload: AudioGenerationCreate
) -> Generation:
    spec = _require_model(payload.model_id, GenerationType.AUDIO)
    if payload.batch_size > spec.max_batch:
        raise _field_error(
            f"{spec.name} supports at most {spec.max_batch} takes per generation.",
            "batch_size",
            f"Maximum {spec.max_batch}",
        )
    settings: dict[str, object] = {"batch_size": payload.batch_size}
    if spec.voices:
        voice = payload.voice or spec.default_voice
        if voice not in {v.id for v in spec.voices}:
            raise _field_error(f"{spec.name} does not have that voice.", "voice", "Choose a listed voice.")
        settings["voice"] = voice
    elif payload.voice:
        raise _field_error(f"{spec.name} has a single voice.", "voice", "Not supported.")
    if spec.languages:
        language = payload.language or spec.default_language
        if language not in {lang.code for lang in spec.languages}:
            raise _field_error(f"{spec.name} does not support that language.", "language", "Unsupported.")
        settings["language"] = language
    elif payload.language:
        raise _field_error(f"{spec.name} does not take a language.", "language", "Not supported.")
    if payload.style_prompt:
        if not spec.supports_style_prompt:
            raise _field_error(f"{spec.name} does not take voice details.", "style_prompt", "Not supported.")
        settings["style_prompt"] = payload.style_prompt

    audio_user_limiter.check(str(user.id), what="speech generations")
    return await _enqueue(
        db, runtime, user, spec, payload.text, settings, credit_cost=spec.credit_cost * payload.batch_size
    )


async def _require_owned_image_asset(db: AsyncSession, user: User, asset_id: uuid.UUID) -> Asset:
    asset = (
        await db.execute(select(Asset).where(Asset.id == asset_id, Asset.user_id == user.id))
    ).scalar_one_or_none()
    if asset is None or asset.media_type != MediaType.IMAGE:
        raise _field_error("Reference image not found.", "reference_asset_id", "Choose one of your images.")
    return asset


async def _reject_if_video_in_flight(db: AsyncSession, user: User) -> None:
    active = await db.scalar(
        select(func.count())
        .select_from(Generation)
        .where(
            Generation.user_id == user.id,
            Generation.type == GenerationType.VIDEO,
            Generation.status.in_(ACTIVE_STATUSES),
        )
    )
    if active:
        raise ConflictError("A video is already generating. Wait for it to finish before starting another.")


async def _enqueue(
    db: AsyncSession,
    runtime: GenerationRuntime,
    user: User,
    spec: ModelSpec,
    prompt: str,
    settings: dict[str, object],
    *,
    credit_cost: int,
    parent_id: uuid.UUID | None = None,
) -> Generation:
    generation = Generation(
        user_id=user.id,
        type=spec.type,
        status=GenerationStatus.QUEUED,
        provider=spec.provider,
        model_id=spec.id,
        prompt=prompt,
        settings=settings,
        credit_cost=credit_cost,
        parent_generation_id=parent_id,
    )
    db.add(generation)
    await db.commit()
    await db.refresh(generation, attribute_names=["assets"])
    runtime.spawn(job_runner.run_generation(runtime, generation.id))
    return generation


async def retry_generation(
    db: AsyncSession, runtime: GenerationRuntime, user: User, generation_id: uuid.UUID
) -> Generation:
    """Re-run a finished generation with the same prompt and settings, linked to its parent."""
    parent = await get_generation(db, user, generation_id)
    if parent.status in ACTIVE_STATUSES:
        raise ConflictError("This generation is still running.")
    settings = parent.settings
    if parent.type == GenerationType.IMAGE:
        image_reference = settings.get("reference_asset_id")
        payload = ImageGenerationCreate(
            prompt=parent.prompt,
            model_id=parent.model_id,
            aspect_ratio=str(settings.get("aspect_ratio", "1:1")),
            batch_size=int(settings.get("batch_size", 1)),
            negative_prompt=settings.get("negative_prompt"),
            reference_asset_id=uuid.UUID(str(image_reference)) if image_reference else None,
        )
        child = await create_image_generation(db, runtime, user, payload)
    elif parent.type == GenerationType.VIDEO:
        reference = settings.get("reference_asset_id")
        video_payload = VideoGenerationCreate(
            prompt=parent.prompt,
            model_id=parent.model_id,
            aspect_ratio=str(settings.get("aspect_ratio", "16:9")),
            duration_s=int(settings.get("duration_s", 3)),
            negative_prompt=settings.get("negative_prompt"),
            reference_asset_id=uuid.UUID(str(reference)) if reference else None,
        )
        child = await create_video_generation(db, runtime, user, video_payload)
    elif parent.type == GenerationType.AUDIO:
        audio_payload = AudioGenerationCreate(
            text=parent.prompt,
            model_id=parent.model_id,
            voice=settings.get("voice"),
            language=settings.get("language"),
            style_prompt=settings.get("style_prompt"),
            batch_size=int(settings.get("batch_size", 1)),
        )
        child = await create_audio_generation(db, runtime, user, audio_payload)
    else:
        raise ValidationError("This generation type cannot be retried yet.")
    child.parent_generation_id = parent.id
    await db.commit()
    return child


async def get_generation(db: AsyncSession, user: User, generation_id: uuid.UUID) -> Generation:
    """Ownership is part of the lookup: another user's id yields 404, never 403 (no existence leak)."""
    stmt = (
        select(Generation)
        .options(selectinload(Generation.assets))
        .where(Generation.id == generation_id, Generation.user_id == user.id)
    )
    generation = (await db.execute(stmt)).scalar_one_or_none()
    if generation is None:
        raise NotFoundError("Generation not found.")
    return generation


async def list_generations(
    db: AsyncSession,
    user: User,
    *,
    generation_type: GenerationType | None,
    status: GenerationStatus | None,
    query: str | None = None,
    cursor: str | None,
    limit: int,
) -> tuple[list[Generation], str | None]:
    """Newest-first keyset pagination on (created_at, id), optionally filtered by prompt/model text."""
    limit = max(1, min(limit, MAX_PAGE_SIZE))
    stmt = select(Generation).options(selectinload(Generation.assets)).where(Generation.user_id == user.id)
    if generation_type is not None:
        stmt = stmt.where(Generation.type == generation_type)
    if status is not None:
        stmt = stmt.where(Generation.status == status)
    if query:
        pattern = f"%{_escape_like(query.strip())}%"
        stmt = stmt.where(
            Generation.prompt.ilike(pattern, escape="\\") | Generation.model_id.ilike(pattern, escape="\\")
        )
    if cursor:
        created_at, last_id = _decode_cursor(cursor)
        stmt = stmt.where(
            (Generation.created_at < created_at)
            | ((Generation.created_at == created_at) & (Generation.id < last_id))
        )
    stmt = stmt.order_by(Generation.created_at.desc(), Generation.id.desc()).limit(limit + 1)
    rows = list((await db.execute(stmt)).scalars().all())
    next_cursor = _encode_cursor(rows[limit - 1]) if len(rows) > limit else None
    return rows[:limit], next_cursor


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _encode_cursor(generation: Generation) -> str:
    raw = f"{generation.created_at.isoformat()}|{generation.id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _decode_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    try:
        created_raw, id_raw = base64.urlsafe_b64decode(cursor.encode()).decode().split("|", 1)
        return datetime.fromisoformat(created_raw), uuid.UUID(id_raw)
    except (ValueError, TypeError) as exc:
        raise ValidationError("Invalid pagination cursor.") from exc
