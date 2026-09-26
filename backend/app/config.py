import json
from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

APP_VERSION = "0.1.0"


class Settings(BaseSettings):
    """Runtime configuration. Every secret comes from the environment; nothing is hard-coded."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    database_url: str | None = None
    session_secret: SecretStr = SecretStr("dev-only-secret-change-me")
    # NoDecode turns off pydantic-settings' JSON decoding so the validator below can accept
    # either a JSON array or the comma-separated form that hosting dashboards make easy.
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )
    # Browser-facing origin of the Next app. OAuth redirect URIs and post-login redirects are
    # built from it, so it must be the address users actually load (Vercel URL in production).
    public_app_url: str = "http://localhost:3000"

    # Google sign-in (OIDC). Both unset → the button is shown as unavailable.
    google_client_id: str | None = None
    google_client_secret: SecretStr | None = None
    # Dev/test only: swap real providers for in-process fakes so UI work spends no quota.
    use_fake_providers: bool = False
    fake_provider_latency_s: float = 2.0
    # Per-user cap on generation requests; protects the free provider quotas from bursts.
    generation_rate_limit_per_minute: int = Field(default=12, ge=1, le=1000)
    # Video is backed by a tiny daily GPU quota shared by every user of this deployment,
    # so submissions are additionally capped per user (per 10 min) and process-wide (per hour).
    video_rate_limit_per_user_10min: int = Field(default=3, ge=1, le=100)
    video_rate_limit_global_per_hour: int = Field(default=6, ge=1, le=1000)
    # Aura-1 costs ~1.4k neurons per 1k characters, so speech gets its own per-user cap.
    audio_rate_limit_per_user_10min: int = Field(default=10, ge=1, le=1000)

    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: SecretStr | None = None

    cloudflare_account_id: str | None = None
    cloudflare_api_token: SecretStr | None = None

    gemini_api_key: SecretStr | None = None

    # Hugging Face token (free account) raises the ZeroGPU quota used for video generation.
    hf_token: SecretStr | None = None

    # Root folder for uploaded media. Left unset it stays environment-scoped, so an existing
    # deployment's assets keep their paths; production sets it explicitly (e.g. forma/production).
    cloudinary_root_folder: str | None = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> object:
        """Accept a JSON array or a comma-separated string; blank entries are dropped."""
        if not isinstance(value, str):
            return value
        text = value.strip()
        if text.startswith("["):
            return json.loads(text)
        return [origin.strip() for origin in text.split(",") if origin.strip()]

    @property
    def cloudinary_root(self) -> str:
        """Where media is uploaded. Never derived from the product name, so renaming the
        product cannot silently orphan assets already stored under the old path."""
        return self.cloudinary_root_folder or f"higgsfield-clone/{self.app_env}"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def google_oauth_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @model_validator(mode="after")
    def _require_production_settings(self) -> "Settings":
        if not self.is_production:
            return self
        missing = [name for name in ("database_url",) if getattr(self, name) is None]
        if self.session_secret.get_secret_value() == "dev-only-secret-change-me":
            missing.append("session_secret")
        if self.use_fake_providers:
            missing.append("use_fake_providers must be false")
        if not self.public_app_url.startswith("https://"):
            missing.append("public_app_url must be an https URL")
        if missing:
            raise ValueError(f"Missing required production settings: {', '.join(missing)}")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
