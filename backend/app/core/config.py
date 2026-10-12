import json
import logging
from functools import lru_cache
from typing import List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_AI_VIDEO_INFERENCE_TIMEOUT_SECONDS = 1200
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    app_name: str = "AutiCare API"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me-to-a-long-random-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 120
    database_url: str = "postgresql://postgres@localhost:5432/auticare_db"
    allow_sqlite_for_tests: bool = False
    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    max_video_upload_mb: int = 100
    ai_video_model_path: Optional[str] = None
    ai_video_model_command: Optional[str] = None
    ai_video_inference_timeout_seconds: int = DEFAULT_AI_VIDEO_INFERENCE_TIMEOUT_SECONDS
    openai_api_key: Optional[str] = None
    # Email configuration
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: str = "noreply@auticare.com"
    otp_expire_minutes: int = 10
    max_otp_attempts: int = 5
    allow_dev_otp_logging: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production"}:
                return False
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                return json.loads(stripped)
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("ai_video_inference_timeout_seconds", mode="before")
    @classmethod
    def validate_ai_video_inference_timeout_seconds(cls, value):
        try:
            if isinstance(value, bool):
                raise ValueError
            if isinstance(value, int):
                timeout_seconds = value
            elif isinstance(value, str) and value.strip().isdecimal():
                timeout_seconds = int(value.strip())
            else:
                raise ValueError
            if timeout_seconds <= 0:
                raise ValueError
        except (TypeError, ValueError):
            logger.warning(
                "Invalid AI_VIDEO_INFERENCE_TIMEOUT_SECONDS; using the %d-second default.",
                DEFAULT_AI_VIDEO_INFERENCE_TIMEOUT_SECONDS,
            )
            return DEFAULT_AI_VIDEO_INFERENCE_TIMEOUT_SECONDS
        return timeout_seconds


@lru_cache()
def get_settings() -> Settings:
    return Settings()
