"""Account and session business logic. Routes stay thin; everything auth-related lives here."""

import logging
from datetime import timedelta

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from app.db.base import utcnow
from app.models import Session, User, UserIdentity
from app.services.google_oauth import PROVIDER as GOOGLE
from app.services.google_oauth import GoogleIdentity, GoogleSignInError

log = logging.getLogger(__name__)

SESSION_LIFETIME = timedelta(days=7)
# Verified when the email is unknown so response timing does not reveal whether an account exists.
_DUMMY_HASH = hash_password("timing-equalizer-not-a-real-password")


async def signup(
    db: AsyncSession, *, email: str, password: str, name: str, user_agent: str | None
) -> tuple[User, str]:
    """Create a user and an initial session. Returns (user, raw session token)."""
    user = User(email=email, password_hash=hash_password(password), name=name)
    db.add(user)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError("An account with this email already exists.") from exc
    token = await _create_session(db, user, user_agent)
    await db.commit()
    log.info("user signed up id=%s", user.id)
    return user, token


async def login(db: AsyncSession, *, email: str, password: str, user_agent: str | None) -> tuple[User, str]:
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    # Google-only accounts have no hash; they take the dummy path so timing stays uniform.
    valid = verify_password(password, user.password_hash if user and user.password_hash else _DUMMY_HASH)
    if user is None or user.password_hash is None or not valid:
        raise UnauthorizedError("Invalid email or password.")
    token = await _create_session(db, user, user_agent)
    await db.commit()
    log.info("user logged in id=%s", user.id)
    return user, token


async def login_with_google(
    db: AsyncSession, identity: GoogleIdentity, *, user_agent: str | None
) -> tuple[User, str]:
    """Resolve a verified Google identity to a local user and open a normal session.

    Order matters: an identity already bound by Google's `sub` wins outright; otherwise a
    *verified* Google email may attach to an existing password account (no duplicate users);
    otherwise a new password-less account is created. Unverified emails never link or create.
    """
    if not identity.email_verified:
        raise GoogleSignInError("Your Google email address is not verified.")
    bound = (
        await db.execute(
            select(UserIdentity).where(
                UserIdentity.provider == GOOGLE, UserIdentity.provider_subject == identity.sub
            )
        )
    ).scalar_one_or_none()
    user: User | None
    if bound is not None:
        user = await db.get_one(User, bound.user_id)
        created = False
    else:
        user = (await db.execute(select(User).where(User.email == identity.email))).scalar_one_or_none()
        created = user is None
        if user is None:
            user = User(
                email=identity.email,
                password_hash=None,
                name=(identity.name or identity.email.split("@")[0])[:80],
                avatar_url=identity.picture[:500] if identity.picture else None,
            )
            db.add(user)
            await db.flush()
        db.add(
            UserIdentity(
                user_id=user.id, provider=GOOGLE, provider_subject=identity.sub, email=identity.email
            )
        )
        await db.flush()
    token = await _create_session(db, user, user_agent)
    await db.commit()
    log.info("google sign-in id=%s new_user=%s linked=%s", user.id, created, bound is None and not created)
    return user, token


async def logout(db: AsyncSession, raw_token: str) -> None:
    await db.execute(delete(Session).where(Session.token_hash == hash_session_token(raw_token)))
    await db.commit()


async def get_user_by_session_token(db: AsyncSession, raw_token: str) -> User | None:
    """Resolve a cookie token to its user, treating expired sessions as absent."""
    stmt = (
        select(User)
        .join(Session, Session.user_id == User.id)
        .where(Session.token_hash == hash_session_token(raw_token), Session.expires_at > utcnow())
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def _create_session(db: AsyncSession, user: User, user_agent: str | None) -> str:
    token = generate_session_token()
    db.add(
        Session(
            user_id=user.id,
            token_hash=hash_session_token(token),
            expires_at=utcnow() + SESSION_LIFETIME,
            user_agent=(user_agent or "")[:255] or None,
        )
    )
    await db.flush()
    return token
