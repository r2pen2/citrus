from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import UserServiceDep
from app.core.config import Settings, get_settings
from app.models.auth import AuthResponse, GoogleAuthRequest
from app.services.auth import AuthService

router = APIRouter(prefix="/auth")


def get_auth_service(
    users: UserServiceDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthService:
    return AuthService(users, settings)


@router.post("/google", response_model=AuthResponse)
async def auth_google(
    body: GoogleAuthRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthResponse:
    """
    Exchange a Google ID token for a Citrus access token.
    Same flow for web and native — configure all OAuth client IDs in GOOGLE_CLIENT_IDS.
    """
    return await auth_service.login_with_google(body.id_token)
