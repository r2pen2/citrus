def test_auth_sso_exchanges_headers(client):
    res = client.post(
        "/auth/sso",
        headers={
            "X-Auth-Request-Email": "Joe@Example.com",
            "X-Auth-Request-User": "joe",
            "X-Auth-Request-Preferred-Username": "Joe D",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["tokenType"] == "bearer"
    assert body["expiresIn"] > 0
    assert body["accessToken"]
    assert body["user"]["id"] == "joe@example.com"
    assert body["user"]["googleSub"] == "joe@example.com"
    assert body["user"]["personalData"]["email"] == "joe@example.com"
    assert body["user"]["personalData"]["displayName"] == "Joe D"


def test_auth_sso_requires_email(client):
    res = client.post("/auth/sso")
    assert res.status_code == 401
    assert res.json()["code"] == "SSO_UNAUTHENTICATED"


def test_auth_sso_rejects_invalid_email(client):
    res = client.post(
        "/auth/sso",
        headers={"X-Auth-Request-Email": "not-an-email"},
    )
    assert res.status_code == 401
    assert res.json()["code"] == "SSO_UNAUTHENTICATED"


def test_auth_sso_then_me_with_jwt(mongo_db, monkeypatch):
    """Full path: SSO headers → Citrus JWT → /me without AUTH_DISABLED."""
    from fastapi.testclient import TestClient

    from app.core.config import clear_settings_cache
    from app.core.db import get_db
    from app.main import app

    monkeypatch.setenv("AUTH_DISABLED", "false")
    monkeypatch.setenv("JWT_SECRET", "unit-test-secret-key-32chars!!!!")
    clear_settings_cache()

    async def _db():
        return mongo_db

    app.dependency_overrides[get_db] = _db
    try:
        with TestClient(app) as c:
            login = c.post(
                "/auth/sso",
                headers={
                    "X-Auth-Request-Email": "sso@citrus.dev",
                    "X-Auth-Request-User": "sso-user",
                },
            )
            assert login.status_code == 200
            access = login.json()["accessToken"]
            assert login.json()["user"]["personalData"]["displayName"] == "sso-user"

            me = c.get("/me", headers={"Authorization": f"Bearer {access}"})
            assert me.status_code == 200
            assert me.json()["id"] == "sso@citrus.dev"

            denied = c.get("/me")
            assert denied.status_code == 401
    finally:
        app.dependency_overrides.clear()
        clear_settings_cache()
