from sqlmodel import SQLModel, Field, JSON
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional, Dict, Any

class ProvenanceRecord(SQLModel, table=True):
    __tablename__ = "provenance_records"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    material_name: str
    origin_facility_id: Optional[UUID] = Field(default=None, foreign_key="facilities.id")
    producer_id: UUID = Field(foreign_key="organizations.id")
    quantity: float
    unit: str
    carbon_footprint_total: float = Field(default=0.000)
    esg_criteria_flags: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON) # JSONB
    signature_verification: bool = Field(default=True)
    status: str = Field(default="draft")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ListingProvenanceSnapshot(SQLModel, table=True):
    __tablename__ = "listing_provenance_snapshots"

    listing_id: UUID = Field(primary_key=True, foreign_key="listings.id")
    provenance_id: UUID = Field(primary_key=True, foreign_key="provenance_records.id")
