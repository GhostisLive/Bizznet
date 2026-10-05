from sqlmodel import SQLModel, Field, Column, JSON
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional, Dict, Any


# ── DB Tables ───────────────────────────────────────────────

class RFQ(SQLModel, table=True):
    """Request for Quote - buyer posts requirements, multiple suppliers bid"""
    __tablename__ = "rfqs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    buyer_id: UUID = Field(foreign_key="organizations.id")
    title: str = Field(max_length=255)
    description: Optional[str] = None
    category: str = Field(max_length=100)
    quantity_required: float
    unit: str = Field(max_length=20)
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    currency: str = Field(default="INR", max_length=3)
    delivery_deadline: Optional[datetime] = None
    delivery_location: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    provenance_requirement: Optional[str] = Field(default=None, max_length=50)  # verified | audited | self_reported | none
    additional_requirements: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    status: str = Field(default="open", max_length=50)  # open | evaluating | awarded | closed | cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None


class RFQBid(SQLModel, table=True):
    """Supplier bids on an RFQ"""
    __tablename__ = "rfq_bids"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    rfq_id: UUID = Field(foreign_key="rfqs.id")
    supplier_id: UUID = Field(foreign_key="organizations.id")
    price_per_unit: float
    total_price: float
    currency: str = Field(default="INR", max_length=3)
    quantity_offered: float
    unit: str = Field(max_length=20)
    lead_time_days: Optional[int] = None
    delivery_terms: Optional[str] = None
    provenance_grade: Optional[str] = Field(default=None, max_length=50)  # verified | audited | self_reported
    technical_proposal: Optional[str] = None
    validity_days: int = Field(default=30)
    status: str = Field(default="submitted", max_length=50)  # submitted | shortlisted | awarded | rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Pydantic Schemas ────────────────────────────────────────

class RFQCreate(SQLModel):
    title: str
    description: Optional[str] = None
    category: str
    quantity_required: float
    unit: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    currency: str = "INR"
    delivery_deadline: Optional[datetime] = None
    delivery_location: Optional[Dict[str, Any]] = None
    provenance_requirement: Optional[str] = None
    additional_requirements: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None


class RFQRead(SQLModel):
    id: UUID
    buyer_id: UUID
    title: str
    description: Optional[str]
    category: str
    quantity_required: float
    unit: str
    budget_min: Optional[float]
    budget_max: Optional[float]
    currency: str
    delivery_deadline: Optional[datetime]
    delivery_location: Optional[Dict[str, Any]]
    provenance_requirement: Optional[str]
    additional_requirements: Optional[Dict[str, Any]]
    status: str
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime]


class RFQBidCreate(SQLModel):
    price_per_unit: float
    quantity_offered: float
    unit: str
    lead_time_days: Optional[int] = None
    delivery_terms: Optional[str] = None
    provenance_grade: Optional[str] = None
    technical_proposal: Optional[str] = None
    validity_days: int = 30


class RFQBidRead(SQLModel):
    id: UUID
    rfq_id: UUID
    supplier_id: UUID
    price_per_unit: float
    total_price: float
    currency: str
    quantity_offered: float
    unit: str
    lead_time_days: Optional[int]
    delivery_terms: Optional[str]
    provenance_grade: Optional[str]
    technical_proposal: Optional[str]
    validity_days: int
    status: str
    created_at: datetime
    updated_at: datetime
