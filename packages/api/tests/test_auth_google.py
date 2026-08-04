from app.core.google_auth import GoogleIdentity


def test_auth_google_exchanges_token(client, monkeypatch):
    async def fake_verify(token: str, client_ids: list[str]) -> GoogleIdentity:
        assert token == "fake-google-id-token"
        return GoogleIdentity(
            sub="google-sub-99",
            email="joe@citrus.dev",
            email_verified=True,
            name="Joe",
            picture="https://example.com/joe.png",
        )

    monkeypatch.setattr(
        "app.services.auth.verify_google_id_token_async",
        fake_verify,
    )
    # Auth route uses settings; ensure client IDs non-empty isn't required when mocked
    res = client.post("/auth/google", json={"idToken": "fake-google-id-token"})
    assert res.status_code == 200
    body = res.json()
    assert body["tokenType"] == "bearer"
    assert body["expiresIn"] > 0
    assert body["accessToken"]
    assert body["user"]["id"] == "google-sub-99"
    assert body["user"]["googleSub"] == "google-sub-99"
    assert body["user"]["personalData"]["email"] == "joe@citrus.dev"

    # App JWT works on /me (disable AUTH_DISABLED path by using real bearer)
    # client fixture has AUTH_DISABLED=true which bypasses bearer — still ok for upsert check
    me = client.get("/me", headers={"Authorization": f"Bearer {body['accessToken']}"})
    assert me.status_code == 200


def test_auth_google_then_me_with_jwt(mongo_db, monkeypatch):
    """Full path: Google login → Citrus JWT → /me without AUTH_DISABLED."""
    from fastapi.testclient import TestClient

    from app.core.config import clear_settings_cache
    from app.core.db import get_db
    from app.main import app

    monkeypatch.setenv("AUTH_DISABLED", "false")
    monkeypatch.setenv("JWT_SECRET", "unit-test-secret-key-32chars!!!!")
    monkeypatch.setenv("GOOGLE_CLIENT_IDS", "test-client.apps.googleusercontent.com")
    clear_settings_cache()

    async def fake_verify(token: str, client_ids: list[str]) -> GoogleIdentity:
        return GoogleIdentity(
            sub="google-sub-jwt",
            email="jwt@citrus.dev",
            email_verified=True,
            name="JWT User",
            picture=None,
        )

    monkeypatch.setattr(
        "app.services.auth.verify_google_id_token_async",
        fake_verify,
    )

    async def _db():
        return mongo_db

    app.dependency_overrides[get_db] = _db
    try:
        with TestClient(app) as c:
            login = c.post("/auth/google", json={"idToken": "fake-google-id-token"})
            assert login.status_code == 200
            access = login.json()["accessToken"]

            me = c.get("/me", headers={"Authorization": f"Bearer {access}"})
            assert me.status_code == 200
            assert me.json()["id"] == "google-sub-jwt"
            assert me.json()["personalData"]["displayName"] == "JWT User"

            denied = c.get("/me")
            assert denied.status_code == 401
    finally:
        app.dependency_overrides.clear()
        clear_settings_cache()
