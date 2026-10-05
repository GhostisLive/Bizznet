from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional


# ── DB Tables ───────────────────────────────────────────────

class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    organization_id: UUID = Field(foreign_key="organizations.id")
    name: str = Field(max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=100)
    unit_price: float = Field(default=0.0)
    moq: int = Field(default=0)
    unit: str = Field(max_length=20)
    stock: int = Field(default=0)
    stock_location: Optional[str] = None
    status: str = Field(default="Active")
    is_listed_on_marketplace: bool = Field(default=False)
    listing_id: Optional[UUID] = Field(default=None, foreign_key="listings.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Pydantic Schemas ────────────────────────────────────────

class ProductCreate(SQLModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit_price: float
    moq: int = 0
    unit: str
    stock: int = 0
    stock_location: Optional[str] = None
    status: str = "Active"
    is_listed_on_marketplace: bool = False


class ProductUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit_price: Optional[float] = None
    moq: Optional[int] = None
    unit: Optional[str] = None
    stock: Optional[int] = None
    stock_location: Optional[str] = None
    status: Optional[str] = None
    is_listed_on_marketplace: Optional[bool] = None


class ProductRead(SQLModel):
    id: UUID
    organization_id: UUID
    name: str
    description: Optional[str]
    category: Optional[str]
    unit_price: float
    moq: int
    unit: str
    stock: int
    stock_location: Optional[str]
    status: str
    is_listed_on_marketplace: bool
    listing_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime


class ProductWithListing(ProductRead):
    """Product with listing status info."""
    listing_status: Optional[str] = None  # "active", "withdrawn", "not_listed"