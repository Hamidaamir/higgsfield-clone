"""Serves FakeStorage blobs. Only mounted when USE_FAKE_PROVIDERS is on (never in production)."""

from fastapi import APIRouter, Request, Response

from app.core.errors import NotFoundError
from app.storage.fake_storage import FakeStorage

router = APIRouter(prefix="/dev-assets", tags=["dev"])


@router.get("/{key}")
async def get_dev_asset(key: str, request: Request) -> Response:
    storage = request.app.state.runtime.storage
    if not isinstance(storage, FakeStorage) or key not in storage.blobs:
        raise NotFoundError("Asset not found.")
    data, mime_type = storage.blobs[key]
    return Response(content=data, media_type=mime_type, headers={"Cache-Control": "no-store"})
