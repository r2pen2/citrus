"""App JWT session auth (issued after Google SSO)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings
from app.core.errors import AppError

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True, slots=True)
class AuthUser:
    """Authenticated Citrus user (uid == Google sub)."""

    uid: str
    email: str | None = None
    email_verified: bool = False
    name: str | None = None
    picture: str | None = None
    phone_number: str | None = None


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    *,
    user_id: str,
    email: str | None,
    settings: Settings,
) -> tuple[str, int]:
    """Return (jwt, expires_in_seconds)."""
    expires_in = settings.jwt_expire_minutes * 60
    now = _utcnow()
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_in


def decode_access_token(token: str, settings: Settings) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub", "type"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise AppError("TOKEN_EXPIRED", "Access token has expired.", status_code=401) from exc
    except jwt.InvalidTokenError as exc:
        raise AppError("INVALID_TOKEN", "Invalid access token.", status_code=401) from exc

    if payload.get("type") != "access":
        raise AppError("INVALID_TOKEN", "Wrong token type.", status_code=401)
    return payload


async def get_auth_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthUser:
    if settings.auth_disabled:
        if not settings.dev_auth_uid:
            raise AppError(
                "AUTH_DISABLED_MISCONFIGURED",
                "AUTH_DISABLED is set but DEV_AUTH_UID is empty.",
                status_code=500,
            )
        return AuthUser(
            uid=settings.dev_auth_uid,
            email=settings.dev_auth_email or None,
            email_verified=True,
            name=settings.dev_auth_name or None,
        )

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AppError("UNAUTHENTICATED", "Missing Bearer token.", status_code=401)

    token = credentials.credentials.strip()
    if not token:
        raise AppError("UNAUTHENTICATED", "Empty Bearer token.", status_code=401)

    payload = decode_access_token(token, settings)
    uid = payload.get("sub")
    if not uid or not isinstance(uid, str):
        raise AppError("INVALID_TOKEN", "Token missing subject.", status_code=401)

    return AuthUser(
        uid=uid,
        email=payload.get("email"),
        email_verified=True,
    )
