from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "citrus-api"
    env: str = "development"
    debug: bool = True

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "citrus"

    # Google OAuth client IDs (web, iOS, Android) — comma-separated
    google_client_ids: str = ""

    # App-issued JWTs (not Firebase)
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Local/dev only — skips Google/JWT verification for API calls
    auth_disabled: bool = False
    dev_auth_uid: str = ""
    dev_auth_email: str = ""
    dev_auth_name: str = ""

    cors_origins: str = (
        "http://localhost:3000,http://localhost:19006,"
        "https://citrus.joed.dev,https://citrusnative.joed.dev"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def google_client_id_list(self) -> list[str]:
        return [c.strip() for c in self.google_client_ids.split(",") if c.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def clear_settings_cache() -> None:
    get_settings.cache_clear()
