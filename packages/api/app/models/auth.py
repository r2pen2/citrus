from pydantic import BaseModel, ConfigDict, Field

from app.models.user import UserResponse


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(alias="idToken", min_length=10)

    model_config = ConfigDict(populate_by_name=True)


class AuthResponse(BaseModel):
    access_token: str = Field(alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")
    expires_in: int = Field(alias="expiresIn")
    user: UserResponse

    model_config = ConfigDict(populate_by_name=True)
