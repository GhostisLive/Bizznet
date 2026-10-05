from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_, func
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from app.modules.rfq.models import RFQ, RFQBid, RFQCreate, RFQBidCreate


async def create_rfq(
    data: RFQCreate,
    buyer_id: UUID,
    db: AsyncSession,
) -> RFQ:
    """Creates a new RFQ from a buyer."""
    rfq = RFQ(
        buyer_id=buyer_id,
        title=data.title,
        description=data.description,
        category=data.category,
        quantity_required=data.quantity_required,
        unit=data.unit,
        budget_min=data.budget_min,
        budget_max=data.budget_max,
        currency=data.currency,
        delivery_deadline=data.delivery_deadline,
        delivery_location=data.delivery_location,
        provenance_requirement=data.provenance_requirement,
        additional_requirements=data.additional_requirements,
        expires_at=data.expires_at,
    )
    db.add(rfq)
    await db.commit()
    await db.refresh(rfq)
    return rfq


async def list_rfqs(
    db: AsyncSession,
    category: Optional[str] = None,
    status: Optional[str] = None,
    buyer_id: Optional[UUID] = None,
    supplier_id: Optional[UUID] = None,
) -> List[RFQ]:
    """
    Lists RFQs with optional filters.
    If supplier_id is provided, only show RFQs they can bid on (not their own, and still open).
    """
    query = select(RFQ)
    
    conditions = []
    
    if category:
        conditions.append(RFQ.category == category)
    if status:
        conditions.append(RFQ.status == status)
    if buyer_id:
        conditions.append(RFQ.buyer_id == buyer_id)
    if supplier_id:
        # Suppliers should not see their own RFQs and only see open ones
        conditions.append(RFQ.buyer_id != supplier_id)
        conditions.append(RFQ.status == "open")
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(RFQ.created_at.desc())
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_rfq_detail(rfq_id: UUID, db: AsyncSession) -> Optional[RFQ]:
    """Gets a single RFQ by ID."""
    result = await db.execute(select(RFQ).where(RFQ.id == rfq_id))
    return result.scalar_one_or_none()


async def update_rfq_status(
    rfq_id: UUID,
    new_status: str,
    db: AsyncSession,
) -> Optional[RFQ]:
    """Updates RFQ status."""
    rfq = await get_rfq_detail(rfq_id, db)
    if not rfq:
        return None
    
    rfq.status = new_status
    rfq.updated_at = datetime.now(timezone.utc)
    db.add(rfq)
    await db.commit()
    await db.refresh(rfq)
    return rfq


async def create_rfq_bid(
    rfq_id: UUID,
    supplier_id: UUID,
    data: RFQBidCreate,
    db: AsyncSession,
) -> RFQBid:
    """Creates a bid on an RFQ from a supplier."""
    # Calculate total price
    total_price = data.price_per_unit * data.quantity_offered
    
    bid = RFQBid(
        rfq_id=rfq_id,
        supplier_id=supplier_id,
        price_per_unit=data.price_per_unit,
        total_price=total_price,
        quantity_offered=data.quantity_offered,
        unit=data.unit,
        lead_time_days=data.lead_time_days,
        delivery_terms=data.delivery_terms,
        provenance_grade=data.provenance_grade,
        technical_proposal=data.technical_proposal,
        validity_days=data.validity_days,
    )
    db.add(bid)
    await db.commit()
    await db.refresh(bid)
    return bid


async def list_rfq_bids(
    rfq_id: Optional[UUID],
    db: AsyncSession,
    supplier_id: Optional[UUID] = None,
) -> List[RFQBid]:
    """
    Lists bids for an RFQ or all bids by a supplier.
    If rfq_id is None and supplier_id is provided, returns all bids by that supplier.
    """
    query = select(RFQBid)
    
    if rfq_id:
        query = query.where(RFQBid.rfq_id == rfq_id)
    
    if supplier_id:
        query = query.where(RFQBid.supplier_id == supplier_id)
    
    query = query.order_by(RFQBid.created_at.desc())
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_bid_status(
    bid_id: UUID,
    new_status: str,
    db: AsyncSession,
) -> Optional[RFQBid]:
    """Updates bid status (e.g., shortlist, award, reject)."""
    result = await db.execute(select(RFQBid).where(RFQBid.id == bid_id))
    bid = result.scalar_one_or_none()
    
    if not bid:
        return None
    
    bid.status = new_status
    bid.updated_at = datetime.now(timezone.utc)
    db.add(bid)
    await db.commit()
    await db.refresh(bid)
    return bid


async def get_rfq_statistics(rfq_id: UUID, db: AsyncSession) -> dict:
    """Gets bid statistics for an RFQ."""
    result = await db.execute(
        select(
            func.count(RFQBid.id).label("total_bids"),
            func.min(RFQBid.total_price).label("lowest_bid"),
            func.max(RFQBid.total_price).label("highest_bid"),
            func.avg(RFQBid.total_price).label("average_bid"),
        ).where(RFQBid.rfq_id == rfq_id)
    )
    
    stats = result.first()
    
    return {
        "total_bids": stats.total_bids or 0,
        "lowest_bid": float(stats.lowest_bid) if stats.lowest_bid else None,
        "highest_bid": float(stats.highest_bid) if stats.highest_bid else None,
        "average_bid": float(stats.average_bid) if stats.average_bid else None,
    }
