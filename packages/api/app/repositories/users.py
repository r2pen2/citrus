from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import (
    UserDocument,
    UserMetadata,
    UserPersonalData,
    default_pfp_url,
    searchable_name,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db["users"]

    async def get_by_id(self, uid: str) -> UserDocument | None:
        raw = await self._col.find_one({"_id": uid})
        if raw is None:
            return None
        return UserDocument.model_validate(raw)

    async def insert(self, doc: UserDocument) -> UserDocument:
        payload = doc.model_dump(by_alias=True, exclude_none=False)
        await self._col.insert_one(payload)
        return doc

    async def replace(self, doc: UserDocument) -> UserDocument:
        payload = doc.model_dump(by_alias=True, exclude_none=False)
        await self._col.replace_one({"_id": doc.id}, payload, upsert=True)
        return doc

    async def update_fields(self, uid: str, set_fields: dict[str, Any]) -> UserDocument | None:
        if not set_fields:
            return await self.get_by_id(uid)
        await self._col.update_one({"_id": uid}, {"$set": set_fields})
        return await self.get_by_id(uid)


def build_new_user(
    uid: str,
    *,
    display_name: str | None,
    email: str | None,
    email_verified: bool,
    picture: str | None,
    phone_number: str | None,
) -> UserDocument:
    """`uid` must be the Google `sub` (stable across web + native clients)."""
    now = _utcnow()
    return UserDocument(
        id=uid,
        googleSub=uid,
        authProvider="google",
        metadata=UserMetadata(
            createdAt=now,
            emailVerified=email_verified,
            lastLoginAt=now,
        ),
        personalData=UserPersonalData(
            displayName=display_name,
            displayNameSearchable=searchable_name(display_name),
            email=email,
            phoneNumber=phone_number,
            pfpUrl=default_pfp_url(uid, picture),
        ),
    )
