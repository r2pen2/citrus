from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

from app.core.config import clear_settings_cache
from app.core.db import get_db
from app.main import app


@pytest.fixture
def mongo_db():
    return AsyncMongoMockClient()["citrus-test"]


@pytest.fixture
def client(mongo_db, monkeypatch):
    monkeypatch.setenv("AUTH_DISABLED", "true")
    monkeypatch.setenv("DEV_AUTH_UID", "test-uid-1")
    monkeypatch.setenv("DEV_AUTH_EMAIL", "test@citrus.dev")
    monkeypatch.setenv("DEV_AUTH_NAME", "Test User")
    monkeypatch.setenv("JWT_SECRET", "unit-test-secret-key-32chars!!!!")
    monkeypatch.setenv("GOOGLE_CLIENT_IDS", "test-client.apps.googleusercontent.com")
    clear_settings_cache()

    async def _db():
        return mongo_db

    app.dependency_overrides[get_db] = _db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    clear_settings_cache()
    # Ensure later tests don't inherit AUTH_DISABLED
    for key in ("AUTH_DISABLED", "DEV_AUTH_UID", "DEV_AUTH_EMAIL", "DEV_AUTH_NAME"):
        os.environ.pop(key, None)
