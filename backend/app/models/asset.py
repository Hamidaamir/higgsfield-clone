import enum
import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Enum, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.generation import Generation


class AssetKind(enum.StrEnum):
    INPUT = "input"  # user upload / reference
    OUTPUT = "output"  # produced by a generation


class MediaType(enum.StrEnum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class Asset(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Metadata + object-storage reference for one media file. Binaries never live in Postgres."""

    __tablename__ = "assets"
    __table_args__ = (
        Index("ix_assets_generation_id", "generation_id"),
        Index("ix_assets_user_created", "user_id", "created_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    generation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("generations.id", ondelete="CASCADE"), nullable=True
    )
    kind: Mapped[AssetKind] = mapped_column(
        Enum(AssetKind, name="asset_kind", values_callable=lambda e: [m.value for m in e]), nullable=False
    )
    media_type: Mapped[MediaType] = mapped_column(
        Enum(MediaType, name="media_type", values_callable=lambda e: [m.value for m in e]), nullable=False
    )
    storage_provider: Mapped[str] = mapped_column(String(40), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    mime_type: Mapped[str] = mapped_column(String(80), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSONB, nullable=False, default=dict)

    generation: Mapped["Generation | None"] = relationship(back_populates="assets")
