from __future__ import annotations

import re

from app.core.auth import AuthUser, create_access_token
from app.core.config import Settings
from app.core.errors import AppError
from app.core.google_auth import GoogleIdentity, verify_google_id_token_async
from app.models.auth import AuthResponse
from app.services.users import UserService

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class AuthService:
    def __init__(self, users: UserService, settings: Settings) -> None:
        self._users = users
        self._settings = settings

    async def login_with_google(self, id_token: str) -> AuthResponse:
        identity = await verify_google_id_token_async(
            id_token,
            self._settings.google_client_id_list,
        )
        auth_user = _identity_to_auth_user(identity)
        return await self._issue_session(auth_user)

    async def login_with_sso(
        self,
        *,
        email: str | None,
        user: str | None = None,
        preferred_username: str | None = None,
    ) -> AuthResponse:
        """
        Exchange Traefik/oauth2-proxy identity headers for a Citrus JWT.
        Stable uid is the normalized email (proxy does not forward Google sub).
        """
        auth_user = _sso_headers_to_auth_user(
            email=email,
            user=user,
            preferred_username=preferred_username,
        )
        return await self._issue_session(auth_user)

    async def _issue_session(self, auth_user: AuthUser) -> AuthResponse:
        user = await self._users.get_or_create_me(auth_user)
        access_token, expires_in = create_access_token(
            user_id=auth_user.uid,
            email=auth_user.email,
            settings=self._settings,
        )
        return AuthResponse(
            accessToken=access_token,
            tokenType="bearer",
            expiresIn=expires_in,
            user=user,
        )


def _identity_to_auth_user(identity: GoogleIdentity) -> AuthUser:
    return AuthUser(
        uid=identity.sub,
        email=identity.email,
        email_verified=identity.email_verified,
        name=identity.name,
        picture=identity.picture,
    )


def _sso_headers_to_auth_user(
    *,
    email: str | None,
    user: str | None,
    preferred_username: str | None,
) -> AuthUser:
    normalized = (email or "").strip().lower()
    if not normalized or not _EMAIL_RE.match(normalized):
        raise AppError(
            "SSO_UNAUTHENTICATED",
            "Missing or invalid X-Auth-Request-Email from SSO proxy.",
            status_code=401,
        )

    display = (preferred_username or user or "").strip()
    if not display or "@" in display:
        display = normalized.split("@", 1)[0]

    return AuthUser(
        uid=normalized,
        email=normalized,
        email_verified=True,
        name=display or None,
        picture=None,
    )
