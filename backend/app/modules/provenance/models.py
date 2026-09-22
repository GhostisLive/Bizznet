from sqlmodel import SQLModel, Field, Column, JSON
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List


# ── DB Tables ───────────────────────────────────────────────

class ProvenanceRecord(SQLModel, table=True):
    __tablename__ = "provenance_records"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    organization_id: UUID = Field(foreign_key="organizations.id")
    type: str = Field(default="self_reported", max_length=50)  # self_reported | audited | verified
    verifying_party: Optional[str] = Field(default=None, max_length=255)
    evidence_url: Optional[str] = Field(default=None, max_length=512)
    verified_at: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    payload: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ListingProvenanceSnapshot(SQLModel, table=True):
    __tablename__ = "listing_provenance_snapshots"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    listing_id: UUID = Field(foreign_key="listings.id")
    confidence_score: float = Field(default=0.0)
    provenance_grade: str = Field(default="self_reported", max_length=50)  # self_reported | audited | verified
    active_provenance_records: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))


# ── Pydantic Schemas ────────────────────────────────────────

class ProvenanceRecordCreate(SQLModel):
    type: str = "self_reported"
    verifying_party: Optional[str] = None
    evidence_url: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class ProvenanceRecordRead(SQLModel):
    id: UUID
    organization_id: UUID
    type: str
    verifying_party: Optional[str] = None
    evidence_url: Optional[str] = None
    verified_at: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    payload: Optional[Dict[str, Any]] = None
    created_at: datetime
