"""Deployment-sensitive configuration.

These settings are what stands between a working production deploy and a broken one, so
each rule is pinned: production refuses unsafe values, CORS accepts the forms a hosting
dashboard makes easy, and the media root never changes under an existing deployment.
"""

import pytest
from pydantic import ValidationError
from pydantic_settings import SettingsError

from app.config import Settings

PROD = {
    "app_env": "production",
    "database_url": "postgresql+asyncpg://user:pass@host:5432/postgres",
    "session_secret": "a-long-random-production-secret",
    "public_app_url": "https://forma-frontend.example.app",
}


DEV = {"app_env": "development", "database_url": None}


def settings(**overrides: object) -> Settings:
    """Build settings from explicit values only, ignoring any developer .env file.

    The test session sets APP_ENV/DATABASE_URL in os.environ for the database fixtures, so
    anything asserting an environment-derived default passes DEV explicitly.
    """
    return Settings(_env_file=None, **overrides)  # type: ignore[arg-type]


# --- production guardrails --------------------------------------------------------------


def test_production_accepts_a_complete_configuration() -> None:
    assert settings(**PROD).is_production


def test_production_rejects_the_development_session_secret() -> None:
    with pytest.raises(ValidationError, match="session_secret"):
        settings(**{**PROD, "session_secret": "dev-only-secret-change-me"})


def test_production_rejects_a_missing_database_url() -> None:
    with pytest.raises(ValidationError, match="database_url"):
        settings(**{**PROD, "database_url": None})


def test_production_rejects_a_non_https_app_url() -> None:
    with pytest.raises(ValidationError, match="public_app_url"):
        settings(**{**PROD, "public_app_url": "http://forma-frontend.example.app"})


def test_production_rejects_fake_providers() -> None:
    with pytest.raises(ValidationError, match="use_fake_providers"):
        settings(**{**PROD, "use_fake_providers": True})


def test_development_keeps_its_forgiving_defaults() -> None:
    dev = settings(**DEV)
    assert not dev.is_production
    assert dev.database_url is None
    assert dev.cors_origins == ["http://localhost:3000"]


# --- CORS ---------------------------------------------------------------------------------


def test_cors_accepts_a_comma_separated_string() -> None:
    parsed = settings(cors_origins="http://localhost:3000,https://forma.example.app")
    assert parsed.cors_origins == ["http://localhost:3000", "https://forma.example.app"]


def test_cors_accepts_a_json_array() -> None:
    parsed = settings(cors_origins='["http://localhost:3000","https://forma.example.app"]')
    assert parsed.cors_origins == ["http://localhost:3000", "https://forma.example.app"]


def test_cors_accepts_a_real_list() -> None:
    assert settings(cors_origins=["http://localhost:3000"]).cors_origins == ["http://localhost:3000"]


def test_cors_trims_whitespace_and_drops_blank_entries() -> None:
    parsed = settings(cors_origins=" http://localhost:3000 , , https://forma.example.app ,")
    assert parsed.cors_origins == ["http://localhost:3000", "https://forma.example.app"]


def test_cors_never_introduces_a_wildcard() -> None:
    for value in ("http://localhost:3000", '["http://localhost:3000"]', ""):
        assert "*" not in settings(cors_origins=value).cors_origins


def test_cors_rejects_malformed_json_rather_than_guessing() -> None:
    with pytest.raises((ValidationError, SettingsError, ValueError)):
        settings(cors_origins='["http://localhost:3000"')


def test_cors_reads_the_comma_form_from_the_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """The form the .env.example documents, and the one hosting dashboards encourage."""
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000,https://forma.example.app")
    assert Settings(_env_file=None).cors_origins == [
        "http://localhost:3000",
        "https://forma.example.app",
    ]


# --- media root ----------------------------------------------------------------------------


def test_cloudinary_root_defaults_to_the_environment_scoped_path() -> None:
    """Unset, an existing deployment keeps uploading exactly where it always has."""
    assert settings(**DEV).cloudinary_root == "higgsfield-clone/development"
    assert settings(**PROD).cloudinary_root == "higgsfield-clone/production"


def test_cloudinary_root_can_be_overridden_for_production() -> None:
    configured = settings(**PROD, cloudinary_root_folder="forma/production")
    assert configured.cloudinary_root == "forma/production"


def test_cloudinary_root_override_does_not_touch_the_development_default() -> None:
    assert settings(cloudinary_root_folder="forma/production").cloudinary_root == "forma/production"
    assert settings(**DEV).cloudinary_root == "higgsfield-clone/development"


# --- things deployment must not have changed -------------------------------------------------


def test_database_url_is_passed_through_untouched() -> None:
    """Direct connection and session pooler differ only by host; neither is rewritten."""
    for url in (
        "postgresql+asyncpg://user:pass@db.example.supabase.co:5432/postgres",
        "postgresql+asyncpg://user.ref:pass@aws-0-region.pooler.supabase.com:5432/postgres",
    ):
        assert settings(**{**PROD, "database_url": url}).database_url == url


def test_session_cookie_settings_are_unchanged() -> None:
    from app.api.deps import SESSION_COOKIE
    from app.services.auth_service import SESSION_LIFETIME

    assert SESSION_COOKIE == "hf_session"
    assert SESSION_LIFETIME.days == 7
