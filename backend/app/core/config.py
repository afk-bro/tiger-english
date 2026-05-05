from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List
import json

import os as _os
_HERE = _os.path.dirname(_os.path.abspath(__file__))
_BACKEND_ENV = _os.path.join(_HERE, "..", "..", ".env")

class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=_BACKEND_ENV,
        extra="ignore"  # Ignore extra fields like SUPABASE_ANON_KEY
    )

    # Supabase
    supabase_url: str
    supabase_secret_key: str

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: str = '["http://localhost:5173", "http://127.0.0.1:5173"]'

    # Environment
    environment: str = "development"

    # AI settings
    anthropic_api_key: str | None = None
    ai_default_model: str = "claude-sonnet-4-6"
    ai_haiku_model: str = "claude-haiku-4-5"
    ai_voice_enabled: bool = False

    # Admin settings
    super_admin_user_ids: str = "[]"  # JSON array of user UUIDs allowed to access /admin endpoints

    # Leonardo AI (used by scripts/generate-lesson-images.ts via dotenv,
    # not yet read by the FastAPI runtime — declared here so the secret
    # has a documented home and any future server-side image endpoint
    # can consume it. Optional so the FastAPI dev server boots without
    # the key set; the script enforces presence at its own boundary.)
    leonardo_api_key: str | None = None

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse allowed origins from string to list"""
        try:
            return json.loads(self.allowed_origins)
        except json.JSONDecodeError:
            return ["http://localhost:5173"]

    @property
    def ai_tutor_enabled(self) -> bool:
        """Check if AI tutor is enabled (API key present and not placeholder)"""
        return bool(
            self.anthropic_api_key
            and not self.anthropic_api_key.startswith("sk-ant-placeholder")
        )

    @property
    def super_admin_ids(self) -> List[str]:
        """Parse super admin user IDs from JSON string"""
        try:
            return json.loads(self.super_admin_user_ids)
        except json.JSONDecodeError:
            return []

settings = Settings()
