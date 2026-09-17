"""Server-side catalog of the models the app can actually run.

The frontend renders from this list and sends back our `id`; provider model names are
never accepted from the client. Only models verified in docs/provider-spikes.md are here.
"""

from dataclasses import dataclass, field

from app.models import GenerationType

# LTX-Video wants multiples of 32; these stay close to the Space's 704x512 default cost.
VIDEO_ASPECT_RATIO_DIMENSIONS: dict[str, tuple[int, int]] = {
    "16:9": (768, 448),
    "9:16": (448, 768),
    "1:1": (512, 512),
}

ASPECT_RATIO_DIMENSIONS: dict[str, tuple[int, int]] = {
    "1:1": (1024, 1024),
    "16:9": (1344, 768),
    "9:16": (768, 1344),
    "4:3": (1152, 896),
    "3:4": (896, 1152),
    "3:2": (1216, 832),
    "2:3": (832, 1216),
}


@dataclass(frozen=True)
class ModelSpec:
    id: str
    name: str
    description: str
    type: GenerationType
    provider: str
    provider_model: str
    aspect_ratios: tuple[str, ...] = ("1:1",)
    max_batch: int = 4
    default_steps: int | None = None
    supports_negative_prompt: bool = False
    supports_reference_image: bool = False
    badge: str | None = None
    credit_cost: int = 1
    tags: tuple[str, ...] = field(default_factory=tuple)
    # Video only: selectable clip lengths in seconds.
    durations_s: tuple[int, ...] = ()
    default_duration_s: int | None = None


IMAGE_MODELS: tuple[ModelSpec, ...] = (
    ModelSpec(
        id="flux-1-schnell",
        name="FLUX.1 Schnell",
        description="Fast, high-quality images in seconds",
        type=GenerationType.IMAGE,
        provider="cloudflare",
        provider_model="@cf/black-forest-labs/flux-1-schnell",
        aspect_ratios=("1:1",),
        default_steps=4,
        badge="TOP",
        tags=("recommended", "fast"),
    ),
    ModelSpec(
        id="sdxl-lightning",
        name="SDXL Lightning",
        description="1024px images in a few steps, any aspect ratio",
        type=GenerationType.IMAGE,
        provider="cloudflare",
        provider_model="@cf/bytedance/stable-diffusion-xl-lightning",
        aspect_ratios=tuple(ASPECT_RATIO_DIMENSIONS),
        default_steps=8,
        supports_negative_prompt=True,
        tags=("fast",),
    ),
    ModelSpec(
        id="lucid-origin",
        name="Lucid Origin",
        description="Leonardo's most prompt-responsive model for design and renders",
        type=GenerationType.IMAGE,
        provider="cloudflare",
        provider_model="@cf/leonardo/lucid-origin",
        aspect_ratios=tuple(ASPECT_RATIO_DIMENSIONS),
        default_steps=20,
        credit_cost=2,
    ),
    ModelSpec(
        id="flux-2-klein",
        name="FLUX.2 Klein",
        description="Generation and reference-guided editing in one model",
        type=GenerationType.IMAGE,
        provider="cloudflare",
        provider_model="@cf/black-forest-labs/flux-2-klein-4b",
        aspect_ratios=("1:1", "16:9", "9:16"),
        max_batch=2,
        default_steps=4,
        supports_reference_image=True,
        badge="NEW",
        credit_cost=3,
        tags=("edit",),
    ),
)

VIDEO_MODELS: tuple[ModelSpec, ...] = (
    ModelSpec(
        id="ltx-video",
        name="LTX Video",
        description="Fast distilled text-to-video and image-to-video clips",
        type=GenerationType.VIDEO,
        provider="hf-space",
        provider_model="Lightricks/ltx-video-distilled",
        aspect_ratios=tuple(VIDEO_ASPECT_RATIO_DIMENSIONS),
        max_batch=1,
        supports_negative_prompt=True,
        supports_reference_image=True,
        badge="NEW",
        credit_cost=10,
        tags=("recommended",),
        durations_s=(2, 3, 4, 5),
        default_duration_s=3,
    ),
)

_MODELS: dict[str, ModelSpec] = {m.id: m for m in (*IMAGE_MODELS, *VIDEO_MODELS)}
DEFAULT_IMAGE_MODEL_ID = "flux-1-schnell"
DEFAULT_VIDEO_MODEL_ID = "ltx-video"


def list_models(model_type: GenerationType | None = None) -> list[ModelSpec]:
    return [m for m in _MODELS.values() if model_type is None or m.type == model_type]


def get_model(model_id: str, model_type: GenerationType | None = None) -> ModelSpec | None:
    spec = _MODELS.get(model_id)
    if spec is None or (model_type is not None and spec.type != model_type):
        return None
    return spec
