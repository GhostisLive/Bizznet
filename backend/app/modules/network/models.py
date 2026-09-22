from sqlmodel import SQLModel, Field, Column, JSON
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional, Dict, Any


# ── DB Tables ───────────────────────────────────────────────

class Organization(SQLModel, table=True):
    __tablename__ = "organizations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    tax_id: Optional[str] = Field(default=None, max_length=100, unique=True)
    role: str = Field(max_length=50)  # raw_material_supplier | manufacturer | distributor | retailer | transporter | auditor | admin
    status: str = Field(default="pending_verification", max_length=50)  # pending_verification | verified | suspended
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Facility(SQLModel, table=True):
    __tablename__ = "facilities"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    organization_id: UUID = Field(foreign_key="organizations.id")
    name: str = Field(max_length=255)
    location: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    carbon_intensity_factor: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Pydantic Schemas ────────────────────────────────────────

class OrganizationCreate(SQLModel):
    name: str
    tax_id: Optional[str] = None
    role: str  # raw_material_supplier | manufacturer | distributor | retailer | transporter | auditor


class OrganizationRead(SQLModel):
    id: UUID
    name: str
    tax_id: Optional[str] = None
    role: str
    status: str
    created_at: datetime
    updated_at: datetime


class FacilityCreate(SQLModel):
    name: str
    location: Optional[Dict[str, Any]] = None
    carbon_intensity_factor: float = 0.0


class FacilityRead(SQLModel):
    id: UUID
    organization_id: UUID
    name: str
    location: Optional[Dict[str, Any]] = None
    carbon_intensity_factor: float
    created_at: datetime
