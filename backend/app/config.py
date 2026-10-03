from pydantic import Field, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "BizzNet Platform Monolith"
    API_V1_STR: str = "/api/v1"

    # Database — Supabase PostgreSQL via the Supavisor pooler.
    # The direct host (db.<ref>.supabase.co) is IPv6-only, so it is not
    # reachable from IPv4-only machines. The pooler exposes IPv4 and is the
    # supported route for application connections.
    DATABASE_URL: str = Field(
        default="",
        validation_alias="DATABASE_URL",
    )

    # When false, startup only verifies connectivity. Schema is owned by the
    # Supabase migrations (01_initial_schema, 02_auth_user_trigger).
    DB_AUTO_CREATE: bool = False

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

    @model_validator(mode="after")
    def _validate_database_url(self) -> "Settings":
        if not self.DATABASE_URL:
            raise ValueError(
                "DATABASE_URL is not set. Add it to backend/.env using the "
                "Supabase Dashboard connection string (Settings -> Database)."
            )

        placeholders = ("<", ">", "DB_PASSWORD", "YOUR_", "REPLACE_")
        if any(token in self.DATABASE_URL for token in placeholders):
            raise ValueError(
                "DATABASE_URL still contains a placeholder value. Replace "
                "<DB_PASSWORD> with the real database password from Supabase "
                "Dashboard -> Project Settings -> Database -> Connection string."
            )

        if not self.DATABASE_URL.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL must use the async driver: "
                "postgresql+asyncpg://user:password@host:port/db"
            )
        return self


settings = Settings()
