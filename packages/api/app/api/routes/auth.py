from typing import Annotated

from fastapi import APIRouter, Depends, Header

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
    Exchange a Google ID token for a Citrus access token (Mongo JWT path).
    Browser UIs use Firebase Google Auth directly against Firestore.
    """
    return await auth_service.login_with_google(body.id_token)


@router.post("/sso", response_model=AuthResponse)
async def auth_sso(
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    x_auth_request_email: Annotated[str | None, Header()] = None,
    x_auth_request_user: Annotated[str | None, Header()] = None,
    x_auth_request_preferred_username: Annotated[str | None, Header()] = None,
) -> AuthResponse:
    """
    Legacy Traefik/oauth2-proxy SSO → JWT. Unused by current UIs (Firebase Google).
    Kept for compatibility if headers are still injected upstream.
    """
    return await auth_service.login_with_sso(
        email=x_auth_request_email,
        user=x_auth_request_user,
        preferred_username=x_auth_request_preferred_username,
    )
