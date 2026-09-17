import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import GenerationStatus, GenerationType, MediaType

PROMPT_MAX_LENGTH = 2000
NEGATIVE_PROMPT_MAX_LENGTH = 500


class ImageGenerationCreate(BaseModel):
    prompt: str = Field(min_length=1, max_length=PROMPT_MAX_LENGTH)
    model_id: str = Field(min_length=1, max_length=80)
    aspect_ratio: str = Field(default="1:1", pattern=r"^\d{1,2}:\d{1,2}$")
    batch_size: int = Field(default=1, ge=1, le=4)
    negative_prompt: str | None = Field(default=None, max_length=NEGATIVE_PROMPT_MAX_LENGTH)
    seed: int | None = Field(default=None, ge=0, le=2**31 - 1)

    @field_validator("prompt")
    @classmethod
    def _prompt(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Prompt is required.")
        return value

    @field_validator("negative_prompt")
    @classmethod
    def _negative(cls, value: str | None) -> str | None:
        value = (value or "").strip()
        return value or None


class VideoGenerationCreate(BaseModel):
    prompt: str = Field(min_length=1, max_length=PROMPT_MAX_LENGTH)
    model_id: str = Field(min_length=1, max_length=80)
    aspect_ratio: str = Field(default="16:9", pattern=r"^\d{1,2}:\d{1,2}$")
    duration_s: int = Field(default=3, ge=1, le=10)
    negative_prompt: str | None = Field(default=None, max_length=NEGATIVE_PROMPT_MAX_LENGTH)
    seed: int | None = Field(default=None, ge=0, le=2**31 - 1)
    # Optional image-to-video source; must be an image asset owned by the caller.
    reference_asset_id: uuid.UUID | None = None

    @field_validator("prompt")
    @classmethod
    def _prompt(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Prompt is required.")
        return value

    @field_validator("negative_prompt")
    @classmethod
    def _negative(cls, value: str | None) -> str | None:
        value = (value or "").strip()
        return value or None


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    media_type: MediaType
    url: str
    thumbnail_url: str | None
    mime_type: str
    size_bytes: int
    width: int | None
    height: int | None
    duration_ms: int | None
    created_at: datetime


class GenerationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: GenerationType
    status: GenerationStatus
    provider: str
    model_id: str
    prompt: str
    settings: dict[str, Any]
    error_code: str | None
    error_message: str | None
    credit_cost: int
    parent_generation_id: uuid.UUID | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    assets: list[AssetResponse]


class GenerationListResponse(BaseModel):
    items: list[GenerationResponse]
    next_cursor: str | None


class ModelResponse(BaseModel):
    id: str
    name: str
    description: str
    type: GenerationType
    provider: str
    aspect_ratios: list[str]
    max_batch: int
    supports_negative_prompt: bool
    supports_reference_image: bool
    badge: str | None
    credit_cost: int
    tags: list[str]
    durations_s: list[int]
    default_duration_s: int | None
