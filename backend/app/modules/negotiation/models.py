from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional


# ── DB Tables ───────────────────────────────────────────────

class Negotiation(SQLModel, table=True):
    __tablename__ = "negotiations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    buyer_id: UUID = Field(foreign_key="organizations.id")
    seller_id: UUID = Field(foreign_key="organizations.id")
    listing_id: UUID = Field(foreign_key="listings.id")
    status: str = Field(default="active", max_length=50)  # active | terms_locked | contract_signed | completed | cancelled
    provenance_reviewed: bool = Field(default=False)  # buyer must review trace before lock
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NegotiationBid(SQLModel, table=True):
    __tablename__ = "negotiation_bids"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    negotiation_id: UUID = Field(foreign_key="negotiations.id")
    sender_id: UUID = Field(foreign_key="organizations.id")
    price: float
    moq: float
    provenance_requirement: Optional[str] = Field(default=None, max_length=50)  # minimum provenance grade required
    terms: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Pydantic Schemas ────────────────────────────────────────

class NegotiationCreate(SQLModel):
    listing_id: UUID
    initial_price: float
    initial_moq: float
    provenance_requirement: Optional[str] = None
    terms: Optional[str] = None


class NegotiationRead(SQLModel):
    id: UUID
    buyer_id: UUID
    seller_id: UUID
    listing_id: UUID
    status: str
    provenance_reviewed: bool
    created_at: datetime


class BidCreate(SQLModel):
    price: float
    moq: float
    provenance_requirement: Optional[str] = None
    terms: Optional[str] = None


class BidRead(SQLModel):
    id: UUID
    negotiation_id: UUID
    sender_id: UUID
    price: float
    moq: float
    provenance_requirement: Optional[str] = None
    terms: Optional[str] = None
    timestamp: datetime
