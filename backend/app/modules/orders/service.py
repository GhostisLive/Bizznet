from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from app.modules.orders.models import (
    Order,
    OrderStatusHistory,
    OrderDocument,
    OrderCreate,
    OrderStatusUpdate,
    OrderDocumentCreate,
)


def _generate_order_number() -> str:
    """Generates a unique order number."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"ORD-{timestamp}"


async def create_order(
    data: OrderCreate,
    buyer_id: UUID,
    seller_id: UUID,
    db: AsyncSession,
    provenance_data: Optional[dict] = None,
) -> Order:
    """Creates a new order from a negotiation or RFQ bid."""
    order = Order(
        buyer_id=buyer_id,
        seller_id=seller_id,
        negotiation_id=data.negotiation_id,
        rfq_bid_id=data.rfq_bid_id,
        order_number=_generate_order_number(),
        title=data.title,
        description=data.description,
        total_amount=data.total_amount,
        currency=data.currency,
        quantity=data.quantity,
        unit=data.unit,
        delivery_deadline=data.delivery_deadline,
        delivery_location=data.delivery_location,
        payment_terms=data.payment_terms,
        provenance_snapshot=provenance_data,
        confirmed_at=datetime.now(timezone.utc),
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    # Create initial status history entry
    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=None,
        new_status="confirmed",
        changed_by=buyer_id,
        notes="Order created",
    )
    db.add(history)
    await db.commit()
    
    return order


async def list_orders(
    db: AsyncSession,
    organization_id: Optional[UUID] = None,
    status: Optional[str] = None,
    as_buyer: bool = False,
    as_seller: bool = False,
) -> List[Order]:
    """Lists orders with optional filters."""
    query = select(Order)
    
    conditions = []
    
    if organization_id:
        if as_buyer:
            conditions.append(Order.buyer_id == organization_id)
        elif as_seller:
            conditions.append(Order.seller_id == organization_id)
        else:
            # Show both buyer and seller orders
            conditions.append(
                (Order.buyer_id == organization_id) | (Order.seller_id == organization_id)
            )
    
    if status:
        conditions.append(Order.status == status)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(Order.created_at.desc())
    
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_order_detail(order_id: UUID, db: AsyncSession) -> Optional[Order]:
    """Gets a single order by ID."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    return result.scalar_one_or_none()


async def update_order_status(
    order_id: UUID,
    data: OrderStatusUpdate,
    changed_by: UUID,
    db: AsyncSession,
) -> Optional[Order]:
    """Updates order status and records history."""
    order = await get_order_detail(order_id, db)
    if not order:
        return None
    
    previous_status = order.status
    order.status = data.new_status
    order.updated_at = datetime.now(timezone.utc)
    
    # Update timestamp fields based on status
    if data.new_status == "in_transit":
        order.shipped_at = datetime.now(timezone.utc)
    elif data.new_status == "delivered":
        order.delivered_at = datetime.now(timezone.utc)
    elif data.new_status == "completed":
        order.completed_at = datetime.now(timezone.utc)
    
    db.add(order)
    
    # Record status change
    history = OrderStatusHistory(
        order_id=order_id,
        previous_status=previous_status,
        new_status=data.new_status,
        changed_by=changed_by,
        notes=data.notes,
    )
    db.add(history)
    
    await db.commit()
    await db.refresh(order)
    
    return order


async def get_order_history(order_id: UUID, db: AsyncSession) -> List[OrderStatusHistory]:
    """Gets status history for an order."""
    result = await db.execute(
        select(OrderStatusHistory)
        .where(OrderStatusHistory.order_id == order_id)
        .order_by(OrderStatusHistory.timestamp.asc())
    )
    return list(result.scalars().all())


async def add_order_document(
    order_id: UUID,
    data: OrderDocumentCreate,
    uploaded_by: UUID,
    db: AsyncSession,
) -> OrderDocument:
    """Adds a document to an order."""
    document = OrderDocument(
        order_id=order_id,
        document_type=data.document_type,
        file_url=data.file_url,
        file_name=data.file_name,
        uploaded_by=uploaded_by,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


async def list_order_documents(order_id: UUID, db: AsyncSession) -> List[OrderDocument]:
    """Lists all documents for an order."""
    result = await db.execute(
        select(OrderDocument)
        .where(OrderDocument.order_id == order_id)
        .order_by(OrderDocument.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def get_order_statistics(organization_id: UUID, db: AsyncSession) -> dict:
    """Gets order statistics for an organization."""
    from sqlalchemy import func
    
    # Total orders as buyer
    buyer_result = await db.execute(
        select(
            func.count(Order.id).label("count"),
            func.sum(Order.total_amount).label("total"),
        ).where(Order.buyer_id == organization_id)
    )
    buyer_stats = buyer_result.first()
    
    # Total orders as seller
    seller_result = await db.execute(
        select(
            func.count(Order.id).label("count"),
            func.sum(Order.total_amount).label("total"),
        ).where(Order.seller_id == organization_id)
    )
    seller_stats = seller_result.first()
    
    # Orders by status
    status_result = await db.execute(
        select(Order.status, func.count(Order.id).label("count"))
        .where(
            (Order.buyer_id == organization_id) | (Order.seller_id == organization_id)
        )
        .group_by(Order.status)
    )
    status_breakdown = {row.status: row.count for row in status_result.fetchall()}
    
    return {
        "as_buyer": {
            "total_orders": buyer_stats.count or 0,
            "total_spent": float(buyer_stats.total) if buyer_stats.total else 0.0,
        },
        "as_seller": {
            "total_orders": seller_stats.count or 0,
            "total_revenue": float(seller_stats.total) if seller_stats.total else 0.0,
        },
        "by_status": status_breakdown,
    }
