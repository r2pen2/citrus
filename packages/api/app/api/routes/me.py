from fastapi import APIRouter

from app.api.deps import AuthUserDep, UserServiceDep
from app.models.user import PatchMeRequest, UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(auth: AuthUserDep, users: UserServiceDep) -> UserResponse:
    """
    Return the authenticated user's profile.
    Creates the Mongo user document on first access (mirrors client authBootstrap).
    """
    return await users.get_or_create_me(auth)


@router.patch("/me", response_model=UserResponse)
async def patch_me(
    body: PatchMeRequest,
    auth: AuthUserDep,
    users: UserServiceDep,
) -> UserResponse:
    """Update mutable profile fields for the authenticated user."""
    return await users.patch_me(auth, body)
