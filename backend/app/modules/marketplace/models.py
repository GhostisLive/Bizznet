from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional


# ── DB Tables ───────────────────────────────────────────────

class Listing(SQLModel, table=True):
    __tablename__ = "listings"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    organization_id: UUID = Field(foreign_key="organizations.id")
    facility_id: Optional[UUID] = Field(default=None, foreign_key="facilities.id")
    title: str = Field(max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=100)  # steel | plastics | textiles | ...
    price: float
    currency: str = Field(default="INR", max_length=3)
    moq: float = Field(default=0.0)
    unit: str = Field(max_length=20)  # MT | kg | meters | ...
    status: str = Field(default="active", max_length=50)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Pydantic Schemas ────────────────────────────────────────

class ListingCreate(SQLModel):
    title: str
    description: Optional[str] = None
    facility_id: Optional[UUID] = None
    category: Optional[str] = None
    price: float
    currency: str = "INR"
    moq: float = 0.0
    unit: str


class ListingRead(SQLModel):
    id: UUID
    organization_id: UUID
    facility_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    currency: str
    moq: float
    unit: str
    status: str
    created_at: datetime
