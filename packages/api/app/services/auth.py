from __future__ import annotations

from app.core.auth import AuthUser, create_access_token
from app.core.config import Settings
from app.core.google_auth import GoogleIdentity, verify_google_id_token_async
from app.models.auth import AuthResponse
from app.services.users import UserService


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
