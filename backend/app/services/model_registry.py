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
class VoiceSpec:
    id: str
    name: str
    description: str


@dataclass(frozen=True)
class LanguageSpec:
    code: str
    name: str


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
    # Audio only: controlled voice / language sets and free-text delivery instructions.
    voices: tuple[VoiceSpec, ...] = ()
    default_voice: str | None = None
    languages: tuple[LanguageSpec, ...] = ()
    default_language: str | None = None
    supports_style_prompt: bool = False


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

# Deepgram Aura-1 speakers as exposed by Cloudflare Workers AI (verified: "luna").
_AURA_VOICES = (
    VoiceSpec("asteria", "Asteria", "Female · clear, warm"),
    VoiceSpec("luna", "Luna", "Female · soft, friendly"),
    VoiceSpec("stella", "Stella", "Female · bright, upbeat"),
    VoiceSpec("athena", "Athena", "Female · calm, measured"),
    VoiceSpec("hera", "Hera", "Female · confident"),
    VoiceSpec("orion", "Orion", "Male · deep, smooth"),
    VoiceSpec("arcas", "Arcas", "Male · natural, relaxed"),
    VoiceSpec("perseus", "Perseus", "Male · energetic"),
    VoiceSpec("angus", "Angus", "Male · warm, narrative"),
    VoiceSpec("orpheus", "Orpheus", "Male · rich, expressive"),
    VoiceSpec("helios", "Helios", "Male · authoritative"),
    VoiceSpec("zeus", "Zeus", "Male · commanding"),
)
_MELO_LANGUAGES = (
    LanguageSpec("en", "English"),
    LanguageSpec("es", "Spanish"),
    LanguageSpec("fr", "French"),
    LanguageSpec("zh", "Chinese"),
    LanguageSpec("ja", "Japanese"),
    LanguageSpec("ko", "Korean"),
)
# Gemini prebuilt voices (verified: "Kore").
_GEMINI_VOICES = (
    VoiceSpec("Kore", "Kore", "Firm, balanced"),
    VoiceSpec("Puck", "Puck", "Upbeat, playful"),
    VoiceSpec("Charon", "Charon", "Informative, deep"),
    VoiceSpec("Fenrir", "Fenrir", "Excitable, bold"),
    VoiceSpec("Aoede", "Aoede", "Breezy, light"),
    VoiceSpec("Zephyr", "Zephyr", "Bright, friendly"),
    VoiceSpec("Leda", "Leda", "Youthful, clear"),
    VoiceSpec("Orus", "Orus", "Firm, mature"),
)

AUDIO_MODELS: tuple[ModelSpec, ...] = (
    ModelSpec(
        id="aura-1",
        name="Aura 1",
        description="Twelve expressive English voices with natural pacing",
        type=GenerationType.AUDIO,
        provider="cloudflare",
        provider_model="@cf/deepgram/aura-1",
        max_batch=2,
        badge="TOP",
        credit_cost=2,
        tags=("recommended", "voices"),
        voices=_AURA_VOICES,
        default_voice="luna",
    ),
    ModelSpec(
        id="melotts",
        name="MeloTTS",
        description="Fast multilingual narration, one natural voice per language",
        type=GenerationType.AUDIO,
        provider="cloudflare",
        provider_model="@cf/myshell-ai/melotts",
        max_batch=4,
        credit_cost=1,
        tags=("fast", "multilingual"),
        languages=_MELO_LANGUAGES,
        default_language="en",
    ),
    ModelSpec(
        id="gemini-tts",
        name="Gemini TTS",
        description="Describe the delivery in words: tone, pace, emotion",
        type=GenerationType.AUDIO,
        provider="gemini",
        provider_model="gemini-2.5-flash-preview-tts",
        max_batch=1,
        badge="NEW",
        credit_cost=3,
        tags=("style",),
        voices=_GEMINI_VOICES,
        default_voice="Kore",
        supports_style_prompt=True,
    ),
)

_MODELS: dict[str, ModelSpec] = {m.id: m for m in (*IMAGE_MODELS, *VIDEO_MODELS, *AUDIO_MODELS)}
DEFAULT_IMAGE_MODEL_ID = "flux-1-schnell"
DEFAULT_VIDEO_MODEL_ID = "ltx-video"
DEFAULT_AUDIO_MODEL_ID = "aura-1"


def list_models(model_type: GenerationType | None = None) -> list[ModelSpec]:
    return [m for m in _MODELS.values() if model_type is None or m.type == model_type]


def get_model(model_id: str, model_type: GenerationType | None = None) -> ModelSpec | None:
    spec = _MODELS.get(model_id)
    if spec is None or (model_type is not None and spec.type != model_type):
        return None
    return spec
