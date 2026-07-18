import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ProductOS API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./local_database.db"
    
    # Auth configuration
    SECRET_KEY: str = "supersecretkeyproductos2026!changeinprod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Mock Auth toggle
    MOCK_AUTH_MODE: bool = True
    
    # Clerk configuration (optional for Phase 1 dev)
    CLERK_API_KEY: str = ""
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
