from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_VERSION = "0.1.0"


class Settings(BaseSettings):
    """Runtime configuration. Every secret comes from the environment; nothing is hard-coded."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    database_url: str | None = None
    session_secret: SecretStr = SecretStr("dev-only-secret-change-me")
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    # Dev/test only: swap real providers for in-process fakes so UI work spends no quota.
    use_fake_providers: bool = False
    fake_provider_latency_s: float = 2.0
    # Per-user cap on generation requests; protects the free provider quotas from bursts.
    generation_rate_limit_per_minute: int = Field(default=12, ge=1, le=1000)

    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: SecretStr | None = None

    cloudflare_account_id: str | None = None
    cloudflare_api_token: SecretStr | None = None

    gemini_api_key: SecretStr | None = None

    # Hugging Face token (free account) raises the ZeroGPU quota used for video generation.
    hf_token: SecretStr | None = None

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @model_validator(mode="after")
    def _require_production_settings(self) -> "Settings":
        if not self.is_production:
            return self
        missing = [name for name in ("database_url",) if getattr(self, name) is None]
        if self.session_secret.get_secret_value() == "dev-only-secret-change-me":
            missing.append("session_secret")
        if self.use_fake_providers:
            missing.append("use_fake_providers must be false")
        if missing:
            raise ValueError(f"Missing required production settings: {', '.join(missing)}")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
