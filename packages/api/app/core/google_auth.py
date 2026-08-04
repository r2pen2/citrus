"""Verify Google Sign-In ID tokens (no Firebase)."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.errors import AppError


@dataclass(frozen=True, slots=True)
class GoogleIdentity:
    sub: str
    email: str | None = None
    email_verified: bool = False
    name: str | None = None
    picture: str | None = None


def verify_google_id_token(token: str, client_ids: list[str]) -> dict[str, Any]:
    """
    Verify a Google ID token against one of our OAuth client IDs.
    Raises ValueError if the token is invalid for every configured audience.
    """
    if not client_ids:
        raise AppError(
            "GOOGLE_CLIENTS_MISCONFIGURED",
            "GOOGLE_CLIENT_IDS is empty. Set web/iOS/Android client IDs.",
            status_code=500,
        )

    request = google_requests.Request()
    last_error: Exception | None = None
    for client_id in client_ids:
        try:
            claims = id_token.verify_oauth2_token(token, request, audience=client_id)
            issuer = claims.get("iss")
            if issuer not in ("accounts.google.com", "https://accounts.google.com"):
                raise ValueError(f"Invalid issuer: {issuer}")
            return claims
        except ValueError as exc:
            last_error = exc
            continue

    raise ValueError(str(last_error) if last_error else "Invalid Google ID token")


def claims_to_google_identity(claims: dict[str, Any]) -> GoogleIdentity:
    sub = claims.get("sub")
    if not sub or not isinstance(sub, str):
        raise AppError("INVALID_GOOGLE_TOKEN", "Google token missing sub.", status_code=401)
    return GoogleIdentity(
        sub=sub,
        email=claims.get("email"),
        email_verified=bool(claims.get("email_verified", False)),
        name=claims.get("name"),
        picture=claims.get("picture"),
    )


async def verify_google_id_token_async(token: str, client_ids: list[str]) -> GoogleIdentity:
    try:
        claims = await asyncio.to_thread(verify_google_id_token, token, client_ids)
    except AppError:
        raise
    except ValueError as exc:
        raise AppError("INVALID_GOOGLE_TOKEN", "Invalid or expired Google ID token.", status_code=401) from exc
    except Exception as exc:  # noqa: BLE001
        raise AppError(
            "GOOGLE_VERIFICATION_FAILED",
            "Could not verify Google ID token.",
            status_code=401,
            details={"reason": str(exc)},
        ) from exc
    return claims_to_google_identity(claims)
