"""Provider-agnostic contracts. The rest of the app only ever sees these types."""

import enum
from dataclasses import dataclass, field
from typing import Protocol


class ProviderErrorCode(enum.StrEnum):
    QUOTA_EXCEEDED = "quota_exceeded"
    RATE_LIMITED = "rate_limited"
    MODEL_UNAVAILABLE = "model_unavailable"
    TIMEOUT = "provider_timeout"
    MALFORMED_RESPONSE = "malformed_response"
    CONTENT_REJECTED = "content_rejected"
    PROVIDER_ERROR = "provider_error"
    NOT_CONFIGURED = "provider_not_configured"


USER_MESSAGES: dict[ProviderErrorCode, str] = {
    ProviderErrorCode.QUOTA_EXCEEDED: "Today's free generation quota is used up. Please try again later.",
    ProviderErrorCode.RATE_LIMITED: "The model is busy right now. Please try again in a moment.",
    ProviderErrorCode.MODEL_UNAVAILABLE: "This model is temporarily unavailable. Try another model.",
    ProviderErrorCode.TIMEOUT: "The model took too long to respond. Please try again.",
    ProviderErrorCode.MALFORMED_RESPONSE: "The model returned an unexpected result. Please try again.",
    ProviderErrorCode.CONTENT_REJECTED: "The model's safety filter rejected this prompt. Try rewording it.",
    ProviderErrorCode.PROVIDER_ERROR: "Generation failed on the provider side. Please try again.",
    ProviderErrorCode.NOT_CONFIGURED: "This provider is not configured on the server.",
}


class ProviderError(Exception):
    """Raised by providers. `message` is internal (logged); `user_message` is safe to show."""

    def __init__(self, code: ProviderErrorCode, message: str, *, retryable: bool = True) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable

    @property
    def user_message(self) -> str:
        return USER_MESSAGES[self.code]


@dataclass(frozen=True)
class ImageGenerationRequest:
    prompt: str
    width: int
    height: int
    steps: int | None = None
    negative_prompt: str | None = None
    seed: int | None = None
    reference_image: bytes | None = None


@dataclass(frozen=True)
class ProviderOutput:
    data: bytes
    mime_type: str
    width: int | None = None
    height: int | None = None
    duration_ms: int | None = None
    extra: dict[str, str | int | float] = field(default_factory=dict)


class ImageGenerationProvider(Protocol):
    name: str

    async def generate(self, provider_model: str, request: ImageGenerationRequest) -> ProviderOutput:
        """Run one synchronous image generation and return the encoded image."""
        ...
