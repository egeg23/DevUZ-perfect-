"""Настройки из окружения. Секреты приходят из /opt/sunscrypt/.env через
Docker Compose и наружу не отдаются: SecretStr не печатается в логах."""

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore")

    database_url: str = "postgresql+psycopg://sunscrypt:sunscrypt@localhost:5432/sunscrypt"
    redis_url: str = "redis://localhost:6379/0"
    git_commit: str = "dev"

    master_key: SecretStr | None = None
    session_secret: SecretStr | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
