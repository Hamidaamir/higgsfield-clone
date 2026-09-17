import uuid

from fastapi import APIRouter, File, UploadFile, status

from app.api.deps import CurrentUser, DbSession, Runtime
from app.core.errors import ValidationError
from app.schemas.generation import AssetResponse
from app.services import asset_service
from app.services.asset_service import MAX_UPLOAD_BYTES

router = APIRouter(prefix="/assets", tags=["assets"])


@router.post("/upload", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def upload_asset(
    user: CurrentUser, db: DbSession, runtime: Runtime, file: UploadFile = File(...)
) -> AssetResponse:
    """Upload a reference image (PNG/JPEG/WebP, ≤10 MB) for image-to-video and future edit workflows."""
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValidationError("Images must be 10 MB or smaller.")
    asset = await asset_service.upload_reference_image(db, runtime, user, data, file.content_type)
    return AssetResponse.model_validate(asset)


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: uuid.UUID, user: CurrentUser, db: DbSession) -> AssetResponse:
    """Metadata + URL for one of the caller's assets (used to show the reference beside an edit)."""
    return AssetResponse.model_validate(await asset_service.get_owned_asset(db, user, asset_id))
