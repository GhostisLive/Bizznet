import logging

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

# pyrefly: ignore [missing-import]
from app.config import settings

logger = logging.getLogger(__name__)

# Create async database engine
# NullPool is used sometimes in serverless, but for modular monolith standard pool is fine.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    # Supabase's pooler requires TLS. Passing this through to asyncpg avoids
    # platform-dependent SSL negotiation failures during startup.
    connect_args={"ssl": "require"},
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def check_db_connection() -> None:
    """Verifies the Supabase connection and surfaces actionable errors."""
    try:
        async with engine.connect() as conn:
            await conn.exec_driver_sql("select 1")
    except Exception as exc:  # noqa: BLE001 - re-raised as RuntimeError
        raise RuntimeError(
            f"Could not connect to Supabase PostgreSQL: {type(exc).__name__}: {exc}\n"
            "Check DATABASE_URL in backend/.env, confirm the password in Supabase "
            "Dashboard -> Project Settings -> Database, and make sure the pooler "
            "region matches the project region."
        ) from exc


async def init_db() -> None:
    """
    Verifies connectivity at startup.

    Schema is owned by the Supabase migrations (01_initial_schema,
    02_auth_user_trigger), so tables are only created when DB_AUTO_CREATE
    is explicitly enabled for local scratch work.
    """
    await check_db_connection()

    if settings.DB_AUTO_CREATE:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.warning("DB_AUTO_CREATE enabled: created tables from SQLModel metadata.")


async def get_db():
    """FastAPI Dependency for database session injection."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
