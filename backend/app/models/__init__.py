"""Import every model here so Alembic's autogenerate sees the full metadata."""

from app.models.asset import Asset, AssetKind, MediaType
from app.models.generation import ACTIVE_STATUSES, Generation, GenerationStatus, GenerationType
from app.models.session import Session
from app.models.user import User
from app.models.user_identity import UserIdentity

__all__ = [
    "ACTIVE_STATUSES",
    "Asset",
    "AssetKind",
    "Generation",
    "GenerationStatus",
    "GenerationType",
    "MediaType",
    "Session",
    "User",
    "UserIdentity",
]
