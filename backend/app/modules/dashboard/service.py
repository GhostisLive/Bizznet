from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, or_
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone, timedelta

from app.modules.orders.models import Order
from app.modules.marketplace.models import Listing
from app.modules.negotiation.models import Negotiation
from app.modules.rfq.models import RFQ


async def get_dashboard_overview(
    organization_id: UUID,
    db: AsyncSession,
) -> dict:
    """
    Get comprehensive dashboard overview for an organization.
    Business logic: Aggregates data from orders, listings, negotiations, RFQs.
    """
    # Get order statistics
    order_stats = await _get_order_stats(organization_id, db)
    
    # Get listing statistics
    listing_stats = await _get_listing_stats(organization_id, db)
    
    # Get negotiation statistics
    negotiation_stats = await _get_negotiation_stats(organization_id, db)
    
    # Get RFQ statistics
    rfq_stats = await _get_rfq_stats(organization_id, db)
    
    # Get recent activity
    recent_activity = await _get_recent_activity(organization_id, db)
    
    # Calculate totals
    total_orders = order_stats["as_buyer"]["total_orders"] + order_stats["as_seller"]["total_orders"]
    total_spent = order_stats["as_buyer"]["total_spent"]
    total_revenue = order_stats["as_seller"]["total_revenue"]
    
    return {
        "summary": {
            "total_orders": total_orders,
            "total_spent": total_spent,
            "total_revenue": total_revenue,
            "active_listings": listing_stats["active_count"],
            "active_negotiations": negotiation_stats["active_count"],
            "open_rfqs": rfq_stats["open_count"],
        },
        "orders": order_stats,
        "listings": listing_stats,
        "negotiations": negotiation_stats,
        "rfqs": rfq_stats,
        "recent_activity": recent_activity,
    }


async def _get_order_stats(organization_id: UUID, db: AsyncSession) -> dict:
    """Get order statistics."""
    # Orders as buyer
    buyer_result = await db.execute(
        select(
            func.count(Order.id).label("count"),
            func.sum(Order.total_amount).label("total"),
        ).where(Order.buyer_id == organization_id)
    )
    buyer_stats = buyer_result.first()
    
    # Orders as seller
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


async def _get_listing_stats(organization_id: UUID, db: AsyncSession) -> dict:
    """Get listing statistics."""
    # Total listings
    total_result = await db.execute(
        select(func.count(Listing.id))
        .where(Listing.organization_id == organization_id)
    )
    total_count = total_result.scalar() or 0
    
    # Active listings
    active_result = await db.execute(
        select(func.count(Listing.id))
        .where(Listing.organization_id == organization_id)
        .where(Listing.status == "active")
    )
    active_count = active_result.scalar() or 0
    
    # Withdrawn listings
    withdrawn_result = await db.execute(
        select(func.count(Listing.id))
        .where(Listing.organization_id == organization_id)
        .where(Listing.status == "withdrawn")
    )
    withdrawn_count = withdrawn_result.scalar() or 0
    
    return {
        "total_count": total_count,
        "active_count": active_count,
        "withdrawn_count": withdrawn_count,
    }


async def _get_negotiation_stats(organization_id: UUID, db: AsyncSession) -> dict:
    """Get negotiation statistics."""
    # Active negotiations
    active_result = await db.execute(
        select(func.count(Negotiation.id))
        .where(
            (Negotiation.buyer_id == organization_id) | 
            (Negotiation.seller_id == organization_id)
        )
        .where(Negotiation.status == "active")
    )
    active_count = active_result.scalar() or 0
    
    # Locked negotiations
    locked_result = await db.execute(
        select(func.count(Negotiation.id))
        .where(
            (Negotiation.buyer_id == organization_id) | 
            (Negotiation.seller_id == organization_id)
        )
        .where(Negotiation.status == "terms_locked")
    )
    locked_count = locked_result.scalar() or 0
    
    return {
        "active_count": active_count,
        "locked_count": locked_count,
        "total_count": active_count + locked_count,
    }


async def _get_rfq_stats(organization_id: UUID, db: AsyncSession) -> dict:
    """Get RFQ statistics."""
    # Open RFQs (created by user)
    open_result = await db.execute(
        select(func.count(RFQ.id))
        .where(RFQ.buyer_id == organization_id)
        .where(RFQ.status == "open")
    )
    open_count = open_result.scalar() or 0
    
    # Closed RFQs
    closed_result = await db.execute(
        select(func.count(RFQ.id))
        .where(RFQ.buyer_id == organization_id)
        .where(RFQ.status == "closed")
    )
    closed_count = closed_result.scalar() or 0
    
    return {
        "open_count": open_count,
        "closed_count": closed_count,
        "total_count": open_count + closed_count,
    }


async def _get_recent_activity(
    organization_id: UUID,
    db: AsyncSession,
    limit: int = 10,
) -> List[dict]:
    """
    Get recent activity across orders, negotiations, and RFQs.
    Business logic: Merges and sorts activities by timestamp.
    """
    activities = []
    
    # Recent orders
    order_result = await db.execute(
        select(Order)
        .where(
            (Order.buyer_id == organization_id) | 
            (Order.seller_id == organization_id)
        )
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    orders = order_result.scalars().all()
    
    for order in orders:
        activities.append({
            "type": "order",
            "id": str(order.id),
            "title": order.title,
            "status": order.status,
            "timestamp": order.created_at.isoformat(),
            "amount": order.total_amount,
            "currency": order.currency,
        })
    
    # Recent negotiations
    neg_result = await db.execute(
        select(Negotiation)
        .where(
            (Negotiation.buyer_id == organization_id) | 
            (Negotiation.seller_id == organization_id)
        )
        .order_by(Negotiation.created_at.desc())
        .limit(5)
    )
    negotiations = neg_result.scalars().all()
    
    for neg in negotiations:
        activities.append({
            "type": "negotiation",
            "id": str(neg.id),
            "status": neg.status,
            "timestamp": neg.created_at.isoformat(),
            "listing_id": str(neg.listing_id),
        })
    
    # Recent RFQs
    rfq_result = await db.execute(
        select(RFQ)
        .where(RFQ.buyer_id == organization_id)
        .order_by(RFQ.created_at.desc())
        .limit(5)
    )
    rfqs = rfq_result.scalars().all()
    
    for rfq in rfqs:
        activities.append({
            "type": "rfq",
            "id": str(rfq.id),
            "title": rfq.title,
            "status": rfq.status,
            "timestamp": rfq.created_at.isoformat(),
        })
    
    # Sort by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]


async def get_revenue_trends(
    organization_id: UUID,
    db: AsyncSession,
    days: int = 30,
) -> dict:
    """
    Get revenue trends over time.
    Business logic: Aggregates order amounts by date.
    """
    from_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Get orders as seller (revenue)
    result = await db.execute(
        select(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("order_count"),
        )
        .where(Order.seller_id == organization_id)
        .where(Order.created_at >= from_date)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    
    trends = []
    for row in result.fetchall():
        trends.append({
            "date": row.date.isoformat(),
            "revenue": float(row.revenue),
            "order_count": row.order_count,
        })
    
    return {
        "period_days": days,
        "from_date": from_date.isoformat(),
        "trends": trends,
    }
