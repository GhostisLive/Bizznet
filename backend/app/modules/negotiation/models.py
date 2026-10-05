from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional


# ── DB Tables ───────────────────────────────────────────────

class NegotiationMessage(SQLModel, table=True):
    __tablename__ = "negotiation_messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    negotiation_id: UUID = Field(foreign_key="negotiations.id", index=True)
    sender_id: UUID = Field(foreign_key="organizations.id")
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    edited_at: Optional[datetime] = Field(default=None)  # Track when message was edited


class MessageReadReceipt(SQLModel, table=True):
    __tablename__ = "message_read_receipts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    message_id: UUID = Field(foreign_key="negotiation_messages.id", index=True)
    user_id: UUID = Field(foreign_key="organizations.id", index=True)
    read_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Pydantic Schemas ────────────────────────────────────────

class NegotiationCreate(SQLModel):
    listing_id: UUID


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
    created_at: datetime


class NegotiationMessageCreate(SQLModel):
    content: str


class NegotiationMessageRead(SQLModel):
    id: UUID
    negotiation_id: UUID
    sender_id: UUID
    content: str
    created_at: datetime
    edited_at: Optional[datetime] = None
    read_by: list[str] = []  # List of user IDs who have read this message


class MessageReadReceiptCreate(SQLModel):
    message_id: UUID


class MessageReadReceiptRead(SQLModel):
    id: UUID
    message_id: UUID
    user_id: UUID
    read_at: datetime

