from fastapi import APIRouter, Query

from app.core.errors import NotFoundError
from app.models import GenerationType
from app.schemas.generation import LanguageResponse, ModelResponse, VoiceResponse
from app.services.model_registry import ModelSpec, get_model, list_models

router = APIRouter(prefix="/models", tags=["models"])


def _to_response(spec: ModelSpec) -> ModelResponse:
    return ModelResponse(
        id=spec.id,
        name=spec.name,
        description=spec.description,
        type=spec.type,
        provider=spec.provider,
        aspect_ratios=list(spec.aspect_ratios),
        max_batch=spec.max_batch,
        supports_negative_prompt=spec.supports_negative_prompt,
        supports_reference_image=spec.supports_reference_image,
        badge=spec.badge,
        credit_cost=spec.credit_cost,
        tags=list(spec.tags),
        durations_s=list(spec.durations_s),
        default_duration_s=spec.default_duration_s,
        voices=[VoiceResponse(id=v.id, name=v.name, description=v.description) for v in spec.voices],
        default_voice=spec.default_voice,
        languages=[LanguageResponse(code=lang.code, name=lang.name) for lang in spec.languages],
        default_language=spec.default_language,
        supports_style_prompt=spec.supports_style_prompt,
    )


@router.get("", response_model=list[ModelResponse])
async def get_models(
    model_type: GenerationType | None = Query(default=None, alias="type"),
) -> list[ModelResponse]:
    return [_to_response(spec) for spec in list_models(model_type)]


@router.get("/{model_id}", response_model=ModelResponse)
async def get_model_by_id(model_id: str) -> ModelResponse:
    spec = get_model(model_id)
    if spec is None:
        raise NotFoundError("Model not found.")
    return _to_response(spec)
