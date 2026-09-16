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
        if missing:
            raise ValueError(f"Missing required production settings: {', '.join(missing)}")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
