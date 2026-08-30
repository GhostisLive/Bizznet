from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class Listing(SQLModel, table=True):
    __tablename__ = "listings"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    seller_id: UUID = Field(foreign_key="organizations.id")
    title: str
    description: Optional[str] = Field(default=None)
    price: float
    unit: str
    quantity_available: float
    carbon_equivalent_index: float = Field(default=0.000)
    status: str = Field(default="active")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
