import uuid

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession, Runtime
from app.core.ratelimit import generation_limiter
from app.models import GenerationStatus, GenerationType
from app.schemas.generation import GenerationListResponse, GenerationResponse, ImageGenerationCreate
from app.services import generation_service
from app.services.generation_service import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

router = APIRouter(prefix="/generations", tags=["generations"])


@router.post("/image", response_model=GenerationResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_image(
    payload: ImageGenerationCreate, user: CurrentUser, db: DbSession, runtime: Runtime
) -> GenerationResponse:
    generation_limiter.check(str(user.id))
    generation = await generation_service.create_image_generation(db, runtime, user, payload)
    return GenerationResponse.model_validate(generation)


@router.get("", response_model=GenerationListResponse)
async def list_generations(
    user: CurrentUser,
    db: DbSession,
    generation_type: GenerationType | None = Query(default=None, alias="type"),
    generation_status: GenerationStatus | None = Query(default=None, alias="status"),
    cursor: str | None = Query(default=None, max_length=200),
    limit: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
) -> GenerationListResponse:
    items, next_cursor = await generation_service.list_generations(
        db, user, generation_type=generation_type, status=generation_status, cursor=cursor, limit=limit
    )
    return GenerationListResponse(
        items=[GenerationResponse.model_validate(g) for g in items], next_cursor=next_cursor
    )


@router.get("/{generation_id}", response_model=GenerationResponse)
async def get_generation(generation_id: uuid.UUID, user: CurrentUser, db: DbSession) -> GenerationResponse:
    return GenerationResponse.model_validate(await generation_service.get_generation(db, user, generation_id))


@router.post(
    "/{generation_id}/retry", response_model=GenerationResponse, status_code=status.HTTP_202_ACCEPTED
)
async def retry_generation(
    generation_id: uuid.UUID, user: CurrentUser, db: DbSession, runtime: Runtime
) -> GenerationResponse:
    generation_limiter.check(str(user.id))
    child = await generation_service.retry_generation(db, runtime, user, generation_id)
    return GenerationResponse.model_validate(child)
