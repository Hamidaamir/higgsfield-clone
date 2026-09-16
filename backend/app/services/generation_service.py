"""Generation use-cases: validate against the model registry, persist, enqueue, read back with ownership."""

import base64
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, ValidationError
from app.models import Generation, GenerationStatus, GenerationType, User
from app.schemas.generation import ImageGenerationCreate
from app.services import job_runner
from app.services.model_registry import get_model
from app.services.runtime import GenerationRuntime

DEFAULT_PAGE_SIZE = 24
MAX_PAGE_SIZE = 60


async def create_image_generation(
    db: AsyncSession, runtime: GenerationRuntime, user: User, payload: ImageGenerationCreate
) -> Generation:
    spec = get_model(payload.model_id, GenerationType.IMAGE)
    if spec is None:
        raise ValidationError(
            "Unknown image model.",
            details={"fields": [{"field": "model_id", "message": "Unsupported model."}]},
        )
    if payload.aspect_ratio not in spec.aspect_ratios:
        raise ValidationError(
            f"{spec.name} does not support the {payload.aspect_ratio} aspect ratio.",
            details={
                "fields": [
                    {"field": "aspect_ratio", "message": f"Supported: {', '.join(spec.aspect_ratios)}"}
                ]
            },
        )
    if payload.batch_size > spec.max_batch:
        raise ValidationError(
            f"{spec.name} supports at most {spec.max_batch} images per generation.",
            details={"fields": [{"field": "batch_size", "message": f"Maximum {spec.max_batch}"}]},
        )
    if payload.negative_prompt and not spec.supports_negative_prompt:
        payload.negative_prompt = None

    settings: dict[str, object] = {"aspect_ratio": payload.aspect_ratio, "batch_size": payload.batch_size}
    if payload.negative_prompt:
        settings["negative_prompt"] = payload.negative_prompt
    if payload.seed is not None:
        settings["seed"] = payload.seed

    generation = Generation(
        user_id=user.id,
        type=GenerationType.IMAGE,
        status=GenerationStatus.QUEUED,
        provider=spec.provider,
        model_id=spec.id,
        prompt=payload.prompt,
        settings=settings,
        credit_cost=spec.credit_cost * payload.batch_size,
    )
    db.add(generation)
    await db.commit()
    await db.refresh(generation, attribute_names=["assets"])
    runtime.spawn(job_runner.run_image_generation(runtime, generation.id))
    return generation


async def retry_generation(
    db: AsyncSession, runtime: GenerationRuntime, user: User, generation_id: uuid.UUID
) -> Generation:
    """Re-run a finished generation with the same prompt and settings, linked to its parent."""
    parent = await get_generation(db, user, generation_id)
    if parent.type != GenerationType.IMAGE:
        raise ValidationError("Only image generations can be retried right now.")
    payload = ImageGenerationCreate(
        prompt=parent.prompt,
        model_id=parent.model_id,
        aspect_ratio=str(parent.settings.get("aspect_ratio", "1:1")),
        batch_size=int(parent.settings.get("batch_size", 1)),
        negative_prompt=parent.settings.get("negative_prompt"),
    )
    child = await create_image_generation(db, runtime, user, payload)
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
