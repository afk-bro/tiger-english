from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
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
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse allowed origins from string to list"""
        try:
            return json.loads(self.allowed_origins)
        except json.JSONDecodeError:
            return ["http://localhost:5173"]
    
    class Config:
        env_file = ".env"

settings = Settings()
