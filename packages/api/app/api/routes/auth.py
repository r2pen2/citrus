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
    Exchange a Google ID token for a Citrus access token.
    Kept for native mobile; browser clients use POST /auth/sso via joed.dev SSO.
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
    Exchange joed.dev Traefik/oauth2-proxy identity headers for a Citrus JWT.
    Requires the request to have passed sso@file (headers injected by Traefik).
    """
    return await auth_service.login_with_sso(
        email=x_auth_request_email,
        user=x_auth_request_user,
        preferred_username=x_auth_request_preferred_username,
    )
