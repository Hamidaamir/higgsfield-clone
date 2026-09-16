"""Password hashing and session token primitives."""

import hashlib
import secrets

import bcrypt

SESSION_TOKEN_BYTES = 32


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except ValueError:
        return False


def generate_session_token() -> str:
    """Opaque, URL-safe, 256-bit random token handed to the browser in an httpOnly cookie."""
    return secrets.token_urlsafe(SESSION_TOKEN_BYTES)


def hash_session_token(token: str) -> str:
    """Tokens are stored hashed so a database leak does not yield usable sessions."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
