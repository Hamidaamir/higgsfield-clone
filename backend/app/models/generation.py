import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.user import User


class GenerationType(enum.StrEnum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class GenerationStatus(enum.StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


ACTIVE_STATUSES = (GenerationStatus.QUEUED, GenerationStatus.PROCESSING)


class Generation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """One user request to an AI provider. Outputs live in `assets`; media bytes live in object storage."""

    __tablename__ = "generations"
    __table_args__ = (
        Index("ix_generations_user_created", "user_id", "created_at"),
        Index("ix_generations_user_type_created", "user_id", "type", "created_at"),
        # Small partial index used by startup reconciliation of interrupted jobs.
        Index(
            "ix_generations_active",
            "status",
            postgresql_where="status IN ('queued', 'processing')",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[GenerationType] = mapped_column(
        Enum(GenerationType, name="generation_type", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    status: Mapped[GenerationStatus] = mapped_column(
        Enum(GenerationStatus, name="generation_status", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=GenerationStatus.QUEUED,
    )
    provider: Mapped[str] = mapped_column(String(40), nullable=False)
    model_id: Mapped[str] = mapped_column(String(80), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    settings: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    provider_job_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    credit_cost: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    parent_generation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("generations.id", ondelete="SET NULL"), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()
    assets: Mapped[list["Asset"]] = relationship(
        back_populates="generation", cascade="all, delete-orphan", order_by="Asset.created_at"
    )
