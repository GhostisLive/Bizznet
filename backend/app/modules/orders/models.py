from sqlmodel import SQLModel, Field, Column, JSON
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional, Dict, Any


# ── DB Tables ───────────────────────────────────────────────

class Order(SQLModel, table=True):
    """Orders created from locked negotiations or awarded RFQ bids"""
    __tablename__ = "orders"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    buyer_id: UUID = Field(foreign_key="organizations.id")
    seller_id: UUID = Field(foreign_key="organizations.id")
    
    # Source of order
    negotiation_id: Optional[UUID] = Field(default=None, foreign_key="negotiations.id")
    rfq_bid_id: Optional[UUID] = Field(default=None, foreign_key="rfq_bids.id")
    
    # Order details
    order_number: str = Field(unique=True, max_length=100)
    title: str = Field(max_length=255)
    description: Optional[str] = None
    
    # Pricing
    total_amount: float
    currency: str = Field(default="INR", max_length=3)
    
    # Quantities
    quantity: float
    unit: str = Field(max_length=20)
    
    # Terms
    delivery_deadline: Optional[datetime] = None
    delivery_location: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    payment_terms: Optional[str] = None
    
    # Provenance tracking
    provenance_snapshot: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Status tracking
    status: str = Field(default="confirmed", max_length=50)
    # confirmed → in_production → ready_to_ship → in_transit → delivered → completed
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class OrderStatusHistory(SQLModel, table=True):
    """Tracks status changes for orders"""
    __tablename__ = "order_status_history"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_id: UUID = Field(foreign_key="orders.id")
    previous_status: Optional[str] = Field(default=None, max_length=50)
    new_status: str = Field(max_length=50)
    changed_by: UUID = Field(foreign_key="organizations.id")
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderDocument(SQLModel, table=True):
    """Documents attached to orders (invoices, shipping docs, etc.)"""
    __tablename__ = "order_documents"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_id: UUID = Field(foreign_key="orders.id")
    document_type: str = Field(max_length=50)  # invoice | packing_list | shipping_label | certificate | other
    file_url: str
    file_name: str = Field(max_length=255)
    uploaded_by: UUID = Field(foreign_key="organizations.id")
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Pydantic Schemas ────────────────────────────────────────

class OrderCreate(SQLModel):
    """Create order from negotiation or RFQ bid"""
    negotiation_id: Optional[UUID] = None
    rfq_bid_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    total_amount: float
    currency: str = "INR"
    quantity: float
    unit: str
    delivery_deadline: Optional[datetime] = None
    delivery_location: Optional[Dict[str, Any]] = None
    payment_terms: Optional[str] = None


class OrderRead(SQLModel):
    id: UUID
    buyer_id: UUID
    seller_id: UUID
    negotiation_id: Optional[UUID]
    rfq_bid_id: Optional[UUID]
    order_number: str
    title: str
    description: Optional[str]
    total_amount: float
    currency: str
    quantity: float
    unit: str
    delivery_deadline: Optional[datetime]
    delivery_location: Optional[Dict[str, Any]]
    payment_terms: Optional[str]
    provenance_snapshot: Optional[Dict[str, Any]]
    status: str
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    completed_at: Optional[datetime]


class OrderStatusUpdate(SQLModel):
    new_status: str
    notes: Optional[str] = None


class OrderDocumentCreate(SQLModel):
    document_type: str
    file_url: str
    file_name: str


class OrderDocumentRead(SQLModel):
    id: UUID
    order_id: UUID
    document_type: str
    file_url: str
    file_name: str
    uploaded_by: UUID
    uploaded_at: datetime
