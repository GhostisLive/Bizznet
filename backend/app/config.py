from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "BizzNet Platform Monolith"
    API_V1_STR: str = "/api/v1"

    # Database — Defaulting to sqlite+aiosqlite for local dev
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///local_ledger.db",
        validation_alias="DATABASE_URL",
    )

    # Supabase credentials
    SUPABASE_URL: str = Field(
        default="https://pyxwimmoqlcqxnnfskwa.supabase.co",
        validation_alias="SUPABASE_URL",
    )
    SUPABASE_ANON_KEY: str = Field(
        default="",
        validation_alias="SUPABASE_ANON_KEY",
    )
    SUPABASE_JWT_SECRET: str = Field(
        default="",
        validation_alias="SUPABASE_JWT_SECRET",
    )

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
