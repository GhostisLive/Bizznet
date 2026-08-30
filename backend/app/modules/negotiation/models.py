from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class Negotiation(SQLModel, table=True):
    __tablename__ = "negotiations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    listing_id: UUID = Field(foreign_key="listings.id")
    buyer_id: UUID = Field(foreign_key="organizations.id")
    status: str = Field(default="initiated")
    final_price: Optional[float] = Field(default=None)
    final_quantity: Optional[float] = Field(default=None)
    locked_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NegotiationBid(SQLModel, table=True):
    __tablename__ = "negotiation_bids"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    negotiation_id: UUID = Field(foreign_key="negotiations.id")
    sender_id: UUID = Field(foreign_key="organizations.id")
    price_proposed: float
    quantity_proposed: float
    terms_yaml: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
