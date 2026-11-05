import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SchemeSathi AI API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    ADMIN_SECRET: str = os.getenv("ADMIN_SECRET", "dev_admin_secret_key_change_in_production")
    
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openrouter")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-4o-mini")
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./schemesathi.db")

    model_config = SettingsConfigDict(env_file=(".env", "services/api/.env"), extra="ignore")

settings = Settings()
