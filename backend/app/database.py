from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from app.config import settings

# Create async database engine
# NullPool is used sometimes in serverless, but for modular monolith standard pool is fine.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def init_db() -> None:
    """
    Initializes the database schema if needed (for local tests).
    In production, migrations are managed via Supabase/Alembic.
    """
    async with engine.begin() as conn:
        # In a real environment, you'd run Alembic migrations.
        # But this enables quick test setup:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_db():
    """FastAPI Dependency for database session injection."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
