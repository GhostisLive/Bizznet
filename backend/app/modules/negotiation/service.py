from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from app.modules.negotiation.models import (
    Negotiation,
    NegotiationBid,
    NegotiationCreate,
    BidCreate,
)
from app.modules.marketplace.models import Listing


async def initiate_negotiation(
    data: NegotiationCreate,
    buyer_id: UUID,
    db: AsyncSession,
) -> dict:
    """Opens a negotiation thread between buyer and listing seller."""
    # Resolve the seller from the listing
    listing_result = await db.execute(
        select(Listing).where(Listing.id == data.listing_id)
    )
    listing = listing_result.scalar_one_or_none()
    if not listing:
        return {"error": "Listing not found"}

    neg = Negotiation(
        buyer_id=buyer_id,
        seller_id=listing.organization_id,
        listing_id=listing.id,
        status="active",
    )
    db.add(neg)
    await db.commit()
    await db.refresh(neg)

    # Save the opening bid
    bid = NegotiationBid(
        negotiation_id=neg.id,
        sender_id=buyer_id,
        price=data.initial_price,
        moq=data.initial_moq,
        provenance_requirement=data.provenance_requirement,
        terms=data.terms,
    )
    db.add(bid)
    await db.commit()

    return {"negotiation": neg}


async def submit_bid(
    negotiation_id: UUID,
    data: BidCreate,
    sender_id: UUID,
    db: AsyncSession,
) -> NegotiationBid | None:
    """Submits a structured counter-offer on an active negotiation."""
    neg_result = await db.execute(
        select(Negotiation).where(Negotiation.id == negotiation_id)
    )
    neg = neg_result.scalar_one_or_none()
    if not neg:
        return None
    if neg.status != "active":
        return None

    bid = NegotiationBid(
        negotiation_id=neg.id,
        sender_id=sender_id,
        price=data.price,
        moq=data.moq,
        provenance_requirement=data.provenance_requirement,
        terms=data.terms,
    )
    db.add(bid)
    await db.commit()
    await db.refresh(bid)
    return bid


async def mark_provenance_reviewed(
    negotiation_id: UUID,
    db: AsyncSession,
) -> Negotiation | None:
    """Marks provenance as reviewed by the buyer — prerequisite for locking terms."""
    result = await db.execute(
        select(Negotiation).where(Negotiation.id == negotiation_id)
    )
    neg = result.scalar_one_or_none()
    if not neg or neg.status != "active":
        return None

    neg.provenance_reviewed = True
    db.add(neg)
    await db.commit()
    await db.refresh(neg)
    return neg


async def lock_terms(
    negotiation_id: UUID,
    db: AsyncSession,
) -> dict:
    """Locks negotiation terms — only allowed after provenance review."""
    result = await db.execute(
        select(Negotiation).where(Negotiation.id == negotiation_id)
    )
    neg = result.scalar_one_or_none()
    if not neg:
        return {"error": "Negotiation not found"}
    if neg.status != "active":
        return {"error": f"Cannot lock a negotiation with status: {neg.status}"}
    if not neg.provenance_reviewed:
        return {"error": "Buyer must review provenance before locking terms"}

    neg.status = "terms_locked"
    db.add(neg)
    await db.commit()
    await db.refresh(neg)
    return {"negotiation": neg}


async def get_negotiations_for_user(
    organization_id: UUID,
    db: AsyncSession,
) -> list[Negotiation]:
    """Returns all negotiations where the user is buyer or seller."""
    query = select(Negotiation).where(
        (Negotiation.buyer_id == organization_id)
        | (Negotiation.seller_id == organization_id)
    )
    result = await db.execute(query)
    return list(result.scalars().all())
