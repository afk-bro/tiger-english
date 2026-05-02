from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List
import json

class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"  # Ignore extra fields like SUPABASE_ANON_KEY
    )

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: str = '["http://localhost:5173"]'

    # Environment
    environment: str = "development"

    # Leonardo AI (used by scripts/generate-lesson-images.ts via dotenv,
    # not yet read by the FastAPI runtime — declared here so the secret
    # has a documented home and any future server-side image endpoint
    # can consume it.)
    leonardo_api_key: str

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse allowed origins from string to list"""
        try:
            return json.loads(self.allowed_origins)
        except json.JSONDecodeError:
            return ["http://localhost:5173"]

settings = Settings()
