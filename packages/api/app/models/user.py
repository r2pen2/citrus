from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class UserMetadata(BaseModel):
    created_at: datetime | None = Field(default=None, alias="createdAt")
    email_verified: bool | None = Field(default=None, alias="emailVerified")
    last_login_at: datetime | None = Field(default=None, alias="lastLoginAt")

    model_config = ConfigDict(populate_by_name=True)


class UserPersonalData(BaseModel):
    display_name: str | None = Field(default=None, alias="displayName")
    display_name_searchable: str | None = Field(default=None, alias="displayNameSearchable")
    email: str | None = None
    phone_number: str | None = Field(default=None, alias="phoneNumber")
    pfp_url: str | None = Field(default=None, alias="pfpUrl")

    model_config = ConfigDict(populate_by_name=True)


class UserDocument(BaseModel):
    """Canonical user document stored in Mongo (`users` collection).

    `_id` is the Google `sub` so web + native share one identity.
    """

    id: str = Field(alias="_id")
    google_sub: str = Field(alias="googleSub")
    auth_provider: str = Field(default="google", alias="authProvider")
    friends: list[str] = Field(default_factory=list)
    groups: list[str] = Field(default_factory=list)
    relations: dict[str, Any] = Field(default_factory=dict)
    metadata: UserMetadata = Field(default_factory=UserMetadata)
    personal_data: UserPersonalData = Field(default_factory=UserPersonalData, alias="personalData")
    transactions: list[str] = Field(default_factory=list)
    notifications: dict[str, Any] = Field(default_factory=dict)
    muted_groups: list[str] = Field(default_factory=list, alias="mutedGroups")
    muted_users: list[str] = Field(default_factory=list, alias="mutedUsers")
    group_invitations: list[str] = Field(default_factory=list, alias="groupInvitations")
    incoming_friend_requests: list[str] = Field(default_factory=list, alias="incomingFriendRequests")
    outgoing_friend_requests: list[str] = Field(default_factory=list, alias="outgoingFriendRequests")

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="before")
    @classmethod
    def default_google_identity(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        uid = data.get("_id") or data.get("id")
        if uid and not data.get("googleSub") and not data.get("google_sub"):
            data["googleSub"] = uid
        if not data.get("authProvider") and not data.get("auth_provider"):
            data["authProvider"] = "google"
        return data


class UserResponse(BaseModel):
    id: str
    google_sub: str = Field(alias="googleSub")
    auth_provider: str = Field(default="google", alias="authProvider")
    friends: list[str]
    groups: list[str]
    metadata: UserMetadata
    personal_data: UserPersonalData = Field(alias="personalData")
    transactions: list[str] = Field(default_factory=list)
    muted_groups: list[str] = Field(default_factory=list, alias="mutedGroups")
    muted_users: list[str] = Field(default_factory=list, alias="mutedUsers")
    group_invitations: list[str] = Field(default_factory=list, alias="groupInvitations")
    incoming_friend_requests: list[str] = Field(default_factory=list, alias="incomingFriendRequests")
    outgoing_friend_requests: list[str] = Field(default_factory=list, alias="outgoingFriendRequests")
    # relations / notifications can be large — omit from default /me; add later if needed
    relation_count: int = 0
    notification_count: int = 0

    model_config = ConfigDict(populate_by_name=True)


class PatchMeRequest(BaseModel):
    display_name: str | None = Field(default=None, alias="displayName")
    phone_number: str | None = Field(default=None, alias="phoneNumber")
    pfp_url: str | None = Field(default=None, alias="pfpUrl")
    email: str | None = None

    model_config = ConfigDict(populate_by_name=True)


def searchable_name(display_name: str | None) -> str | None:
    if not display_name:
        return None
    return display_name.lower().replace(" ", "")


def default_pfp_url(uid: str, picture: str | None) -> str:
    return picture or f"https://robohash.org/{uid}"


def user_to_response(doc: UserDocument) -> UserResponse:
    return UserResponse(
        id=doc.id,
        googleSub=doc.google_sub,
        authProvider=doc.auth_provider,
        friends=doc.friends,
        groups=doc.groups,
        metadata=doc.metadata,
        personalData=doc.personal_data,
        transactions=doc.transactions,
        mutedGroups=doc.muted_groups,
        mutedUsers=doc.muted_users,
        groupInvitations=doc.group_invitations,
        incomingFriendRequests=doc.incoming_friend_requests,
        outgoingFriendRequests=doc.outgoing_friend_requests,
        relation_count=len(doc.relations or {}),
        notification_count=_notification_count(doc.notifications),
    )


def _notification_count(notifications: dict[str, Any]) -> int:
    count = 0
    for bucket in notifications.values():
        if isinstance(bucket, dict):
            count += len(bucket)
    return count
