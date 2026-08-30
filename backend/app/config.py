import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "BizzNet Platform Monolith"
    API_V1_STR: str = "/api/v1"
    
    # Database - Defaulting to sqlite+aiosqlite
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///local_ledger.db",
        validation_alias="DATABASE_URL"
    )
    
    # Supabase credentials (for local JWT decoding if verifying locally)
    SUPABASE_URL: str = Field(
        default="https://pyxwimmoqlcqxnnfskwa.supabase.co",
        validation_alias="SUPABASE_URL"
    )
    SUPABASE_JWT_SECRET: str = Field(
        default="",
        validation_alias="SUPABASE_JWT_SECRET"
    )

    class Config:
        case_sensitive = True

settings = Settings()
