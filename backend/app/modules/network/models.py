from sqlmodel import SQLModel, Field, JSON
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional, Dict, Any

class Organization(SQLModel, table=True):
    __tablename__ = "organizations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    tax_id: Optional[str] = Field(default=None, unique=True)
    role: str
    status: str = Field(default="pending_verification")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Facility(SQLModel, table=True):
    __tablename__ = "facilities"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    organization_id: UUID = Field(foreign_key="organizations.id")
    name: str
    location: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON) # JSONB coordinates/location info
    carbon_intensity_factor: float = Field(default=0.0000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
