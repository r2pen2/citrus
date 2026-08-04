import pytest

from app.core.config import Settings
from app.core.auth import create_access_token, decode_access_token
from app.core.errors import AppError
from app.core.google_auth import claims_to_google_identity


def test_google_claims_to_identity():
    identity = claims_to_google_identity(
        {
            "sub": "google-sub-1",
            "email": "a@b.com",
            "email_verified": True,
            "name": "Ada",
            "picture": "https://example.com/a.png",
        }
    )
    assert identity.sub == "google-sub-1"
    assert identity.email == "a@b.com"
    assert identity.name == "Ada"


def test_google_claims_missing_sub():
    with pytest.raises(AppError) as exc:
        claims_to_google_identity({})
    assert exc.value.code == "INVALID_GOOGLE_TOKEN"


def test_app_jwt_roundtrip():
    settings = Settings(jwt_secret="unit-test-secret-key-32chars!!!!", jwt_expire_minutes=60)
    token, expires_in = create_access_token(user_id="sub-1", email="a@b.com", settings=settings)
    assert expires_in == 3600
    payload = decode_access_token(token, settings)
    assert payload["sub"] == "sub-1"
    assert payload["email"] == "a@b.com"
    assert payload["type"] == "access"


def test_app_jwt_rejects_bad_secret():
    settings = Settings(jwt_secret="unit-test-secret-key-32chars!!!!", jwt_expire_minutes=60)
    token, _ = create_access_token(user_id="sub-1", email=None, settings=settings)
    with pytest.raises(AppError) as exc:
        decode_access_token(
            token,
            Settings(jwt_secret="other-secret-key-32-characters!!!!", jwt_expire_minutes=60),
        )
    assert exc.value.code == "INVALID_TOKEN"
