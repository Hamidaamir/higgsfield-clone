import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import CITEXT, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class UserIdentity(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """An external login bound to a local user. The provider's stable subject is the key;
    the email is kept only for display/audit and is never used to look the identity up."""

    __tablename__ = "user_identities"
    __table_args__ = (UniqueConstraint("provider", "provider_subject", name="uq_user_identities_subject"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(CITEXT(), nullable=True)

    user: Mapped["User"] = relationship(back_populates="identities")
