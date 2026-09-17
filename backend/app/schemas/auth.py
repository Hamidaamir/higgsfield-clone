import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


def validate_password_strength(password: str) -> str:
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters.")
    if len(password) > PASSWORD_MAX_LENGTH:
        raise ValueError(f"Password must be at most {PASSWORD_MAX_LENGTH} characters.")
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        raise ValueError("Password must contain at least one letter and one number.")
    return password


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = Field(min_length=1, max_length=80)
    accept_terms: bool

    @field_validator("password")
    @classmethod
    def _password(cls, value: str) -> str:
        return validate_password_strength(value)

    @field_validator("name")
    @classmethod
    def _name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name is required.")
        return value

    @field_validator("accept_terms")
    @classmethod
    def _terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError("You must accept the Terms of Use.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: str
    avatar_url: str | None
    created_at: datetime
    # False for Google-only accounts, so the UI can explain how they sign in.
    has_password: bool = True


class AuthProvidersResponse(BaseModel):
    """Which sign-in methods this deployment offers (Google needs credentials configured)."""

    google: bool
    fake_google: bool = False


class AuthResponse(BaseModel):
    user: UserResponse


class SessionResponse(BaseModel):
    """Current session; `user` is null for anonymous visitors (200, not 401, to keep the UI quiet)."""

    user: UserResponse | None
