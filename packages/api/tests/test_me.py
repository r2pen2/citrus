def test_get_me_creates_user(client):
    res = client.get("/me")
    assert res.status_code == 200
    body = res.json()
    assert body["id"] == "test-uid-1"
    assert body["googleSub"] == "test-uid-1"
    assert body["authProvider"] == "google"
    assert body["personalData"]["displayName"] == "Test User"
    assert body["personalData"]["email"] == "test@citrus.dev"
    assert body["personalData"]["pfpUrl"].startswith("https://robohash.org/")
    assert body["metadata"]["emailVerified"] is True
    assert body["friends"] == []
    assert body["groups"] == []


def test_get_me_is_idempotent(client):
    first = client.get("/me")
    second = client.get("/me")
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert client.get("/me").json()["personalData"]["email"] == "test@citrus.dev"


def test_patch_me_display_name(client):
    client.get("/me")
    res = client.patch("/me", json={"displayName": "Joe Citrus"})
    assert res.status_code == 200
    body = res.json()
    assert body["personalData"]["displayName"] == "Joe Citrus"
    assert body["personalData"]["displayNameSearchable"] == "joecitrus"


def test_patch_me_rejects_empty_display_name(client):
    client.get("/me")
    res = client.patch("/me", json={"displayName": "   "})
    assert res.status_code == 422
    assert res.json()["code"] == "INVALID_DISPLAY_NAME"


def test_unauthenticated_when_auth_enabled(monkeypatch, mongo_db):
    from fastapi.testclient import TestClient

    from app.core.config import clear_settings_cache
    from app.core.db import get_db
    from app.main import app

    monkeypatch.setenv("AUTH_DISABLED", "false")
    monkeypatch.delenv("DEV_AUTH_UID", raising=False)
    clear_settings_cache()

    async def _db():
        return mongo_db

    app.dependency_overrides[get_db] = _db
    try:
        with TestClient(app) as c:
            res = c.get("/me")
            assert res.status_code == 401
            assert res.json()["code"] == "UNAUTHENTICATED"
    finally:
        app.dependency_overrides.clear()
        clear_settings_cache()
