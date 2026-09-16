"""generations and assets

Revision ID: a459ef1b18cf
Revises: f6e16d55cef5
Create Date: 2026-09-17 02:06:02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "a459ef1b18cf"
down_revision: str | Sequence[str] | None = "f6e16d55cef5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

generation_type = sa.Enum("image", "video", "audio", name="generation_type")
generation_status = sa.Enum(
    "queued", "processing", "completed", "failed", "cancelled", name="generation_status"
)
asset_kind = sa.Enum("input", "output", name="asset_kind")
media_type = sa.Enum("image", "video", "audio", name="media_type")


def upgrade() -> None:
    op.create_table(
        "generations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("type", generation_type, nullable=False),
        sa.Column("status", generation_status, nullable=False, server_default="queued"),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("model_id", sa.String(length=80), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("settings", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("provider_job_id", sa.String(length=255), nullable=True),
        sa.Column("error_code", sa.String(length=40), nullable=True),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        sa.Column("credit_cost", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("parent_generation_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["parent_generation_id"], ["generations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_generations_active",
        "generations",
        ["status"],
        unique=False,
        postgresql_where="status IN ('queued', 'processing')",
    )
    op.create_index("ix_generations_user_created", "generations", ["user_id", "created_at"], unique=False)
    op.create_index(
        "ix_generations_user_type_created", "generations", ["user_id", "type", "created_at"], unique=False
    )

    op.create_table(
        "assets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("generation_id", sa.UUID(), nullable=True),
        sa.Column("kind", asset_kind, nullable=False),
        sa.Column("media_type", media_type, nullable=False),
        sa.Column("storage_provider", sa.String(length=40), nullable=False),
        sa.Column("storage_key", sa.String(length=255), nullable=False),
        sa.Column("url", sa.String(length=1000), nullable=False),
        sa.Column("thumbnail_url", sa.String(length=1000), nullable=True),
        sa.Column("mime_type", sa.String(length=80), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["generation_id"], ["generations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_assets_generation_id", "assets", ["generation_id"], unique=False)
    op.create_index("ix_assets_user_created", "assets", ["user_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_assets_user_created", table_name="assets")
    op.drop_index("ix_assets_generation_id", table_name="assets")
    op.drop_table("assets")
    op.drop_index("ix_generations_user_type_created", table_name="generations")
    op.drop_index("ix_generations_user_created", table_name="generations")
    op.drop_index("ix_generations_active", table_name="generations")
    op.drop_table("generations")
    for enum in (media_type, asset_kind, generation_status, generation_type):
        enum.drop(op.get_bind(), checkfirst=True)
