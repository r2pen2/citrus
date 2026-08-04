from __future__ import annotations

from datetime import datetime, timezone

from app.core.auth import AuthUser
from app.core.errors import AppError
from app.models.user import (
    PatchMeRequest,
    UserDocument,
    UserResponse,
    searchable_name,
    user_to_response,
)
from app.repositories.users import UserRepository, build_new_user


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserService:
    def __init__(self, users: UserRepository) -> None:
        self._users = users

    async def get_or_create_me(self, auth: AuthUser) -> UserResponse:
        existing = await self._users.get_by_id(auth.uid)
        if existing is None:
            created = build_new_user(
                auth.uid,
                display_name=auth.name,
                email=auth.email,
                email_verified=auth.email_verified,
                picture=auth.picture,
                phone_number=auth.phone_number,
            )
            await self._users.insert(created)
            fetched = await self._users.get_by_id(auth.uid)
            if fetched is None:
                raise AppError("USER_NOT_FOUND", "User missing after create.", status_code=500)
            return user_to_response(fetched)

        updated = await self._touch_login(existing, auth)
        return user_to_response(updated)

    async def _touch_login(self, user: UserDocument, auth: AuthUser) -> UserDocument:
        """Refresh login metadata; fill missing profile fields from the token when empty."""
        set_fields: dict = {
            "metadata.lastLoginAt": _utcnow(),
            "metadata.emailVerified": auth.email_verified,
        }

        pd = user.personal_data
        if not pd.email and auth.email:
            set_fields["personalData.email"] = auth.email
        if not pd.phone_number and auth.phone_number:
            set_fields["personalData.phoneNumber"] = auth.phone_number
        if not pd.display_name and auth.name:
            set_fields["personalData.displayName"] = auth.name
            set_fields["personalData.displayNameSearchable"] = searchable_name(auth.name)
        if not pd.pfp_url and auth.picture:
            set_fields["personalData.pfpUrl"] = auth.picture

        result = await self._users.update_fields(auth.uid, set_fields)
        if result is None:
            raise AppError("USER_NOT_FOUND", "User disappeared during update.", status_code=404)
        return result

    async def patch_me(self, auth: AuthUser, body: PatchMeRequest) -> UserResponse:
        existing = await self._users.get_by_id(auth.uid)
        if existing is None:
            # Ensure a doc exists first (same as GET /me)
            await self.get_or_create_me(auth)

        set_fields: dict = {}
        if body.display_name is not None:
            name = body.display_name.strip()
            if not name:
                raise AppError("INVALID_DISPLAY_NAME", "displayName cannot be empty.", status_code=422)
            set_fields["personalData.displayName"] = name
            set_fields["personalData.displayNameSearchable"] = searchable_name(name)
        if body.phone_number is not None:
            set_fields["personalData.phoneNumber"] = body.phone_number.strip() or None
        if body.pfp_url is not None:
            set_fields["personalData.pfpUrl"] = body.pfp_url.strip() or None
        if body.email is not None:
            set_fields["personalData.email"] = body.email.strip() or None

        if not set_fields:
            doc = await self._users.get_by_id(auth.uid)
            if doc is None:
                raise AppError("USER_NOT_FOUND", "User not found.", status_code=404)
            return user_to_response(doc)

        updated = await self._users.update_fields(auth.uid, set_fields)
        if updated is None:
            raise AppError("USER_NOT_FOUND", "User not found.", status_code=404)
        return user_to_response(updated)
