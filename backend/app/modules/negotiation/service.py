from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from uuid import UUID
from datetime import datetime, timezone

from app.modules.negotiation.models import (
    Negotiation,
    NegotiationBid,
    NegotiationMessage,
    MessageReadReceipt,
    NegotiationCreate,
    BidCreate,
    NegotiationMessageCreate,
)
from app.modules.marketplace.models import Listing
from app.modules.network.models import Organization
from app.modules.network.service import MARKETPLACE_SELLER_ROLES, normalize_role


async def initiate_negotiation(
    data: NegotiationCreate,
    buyer_id: UUID,
    buyer_role: str,
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

    seller_result = await db.execute(
        select(Organization).where(Organization.id == listing.organization_id)
    )
    seller = seller_result.scalar_one_or_none()
    allowed_roles = MARKETPLACE_SELLER_ROLES.get(normalize_role(buyer_role), [])
    if not seller or normalize_role(seller.role) not in allowed_roles:
        return {"error": "Your role cannot negotiate with this organization"}

    neg = Negotiation(
        buyer_id=buyer_id,
        seller_id=listing.organization_id,
        listing_id=listing.id,
        status="active",
    )
    db.add(neg)
    await db.commit()
    await db.refresh(neg)

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
    """Locks negotiation terms — only allowed after provenance review.

    Enforces that buyer must have reviewed provenance trace before terms can be locked.
    """
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


async def get_enriched_negotiations(
    organization_id: UUID,
    db: AsyncSession,
) -> list[dict]:
    """
    Returns all negotiations enriched with listing details, org names, and bids.
    Moves the data-join logic out of the frontend.
    """
    from app.modules.network.models import Organization

    query = select(Negotiation).where(
        or_(
            Negotiation.buyer_id == organization_id,
            Negotiation.seller_id == organization_id,
        )
    ).order_by(Negotiation.created_at.desc())

    result = await db.execute(query)
    negotiations = list(result.scalars().all())

    enriched = []
    for neg in negotiations:
        # Listing info
        listing_result = await db.execute(
            select(Listing).where(Listing.id == neg.listing_id)
        )
        listing = listing_result.scalar_one_or_none()

        # Buyer org
        buyer_result = await db.execute(
            select(Organization).where(Organization.id == neg.buyer_id)
        )
        buyer_org = buyer_result.scalar_one_or_none()

        # Seller org
        seller_result = await db.execute(
            select(Organization).where(Organization.id == neg.seller_id)
        )
        seller_org = seller_result.scalar_one_or_none()

        # Bids
        bids_result = await db.execute(
            select(NegotiationBid)
            .where(NegotiationBid.negotiation_id == neg.id)
            .order_by(NegotiationBid.created_at.asc())
        )
        bids = list(bids_result.scalars().all())

        enriched.append({
            "id": str(neg.id),
            "listing_id": str(neg.listing_id),
            "buyer_id": str(neg.buyer_id),
            "seller_id": str(neg.seller_id),
            "status": neg.status,
            "provenance_reviewed": neg.provenance_reviewed,
            "created_at": neg.created_at.isoformat(),
            # Enriched fields
            "listing": {
                "title": listing.title if listing else "Unknown",
                "category": listing.category if listing else None,
                "price": listing.price if listing else 0,
                "moq": listing.moq if listing else 0,
                "unit": listing.unit if listing else "",
            } if listing else None,
            "buyer": {
                "id": str(buyer_org.id) if buyer_org else None,
                "name": buyer_org.name if buyer_org else "Unknown",
                "role": buyer_org.role if buyer_org else None,
            },
            "seller": {
                "id": str(seller_org.id) if seller_org else None,
                "name": seller_org.name if seller_org else "Unknown",
                "role": seller_org.role if seller_org else None,
            },
            "bids": [
                {
                    "id": str(b.id),
                    "sender_id": str(b.sender_id),
                    "price": b.price,
                    "moq": b.moq,
                    "provenance_requirement": b.provenance_requirement,
                    "terms": b.terms,
                    "timestamp": b.created_at.isoformat(),
                }
                for b in bids
            ],
        })

    return enriched


async def send_message(
    negotiation_id: UUID,
    data: NegotiationMessageCreate,
    sender_id: UUID,
    db: AsyncSession,
) -> NegotiationMessage:
    """Sends a chat message in a negotiation."""
    # Verify negotiation exists and user is participant
    neg_result = await db.execute(
        select(Negotiation).where(Negotiation.id == negotiation_id)
    )
    neg = neg_result.scalar_one_or_none()
    if not neg:
        raise ValueError("Negotiation not found")

    # Verify sender is either buyer or seller
    if neg.buyer_id != sender_id and neg.seller_id != sender_id:
        raise ValueError("Not a participant in this negotiation")

    msg = NegotiationMessage(
        negotiation_id=negotiation_id,
        sender_id=sender_id,
        content=data.content,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def get_messages(
    negotiation_id: UUID,
    db: AsyncSession,
) -> list[NegotiationMessage]:
    """Gets all messages for a negotiation."""
    # Verify negotiation exists
    neg_result = await db.execute(
        select(Negotiation).where(Negotiation.id == negotiation_id)
    )
    neg = neg_result.scalar_one_or_none()
    if not neg:
        raise ValueError("Negotiation not found")

    msg_result = await db.execute(
        select(NegotiationMessage)
        .where(NegotiationMessage.negotiation_id == negotiation_id)
        .order_by(NegotiationMessage.created_at.asc())
    )
    return list(msg_result.scalars().all())


async def mark_message_read(
    message_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> MessageReadReceipt | None:
    """Marks a message as read by a user."""
    # Check if already read
    existing = await db.execute(
        select(MessageReadReceipt).where(
            MessageReadReceipt.message_id == message_id,
            MessageReadReceipt.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        return None  # Already read

    receipt = MessageReadReceipt(message_id=message_id, user_id=user_id)
    db.add(receipt)
    await db.commit()
    await db.refresh(receipt)
    return receipt


async def mark_messages_read_batch(
    message_ids: list[UUID],
    user_id: UUID,
    db: AsyncSession,
) -> list[MessageReadReceipt]:
    """Marks multiple messages as read by a user."""
    # Find which messages aren't already read
    existing = await db.execute(
        select(MessageReadReceipt.message_id).where(
            MessageReadReceipt.message_id.in_(message_ids),
            MessageReadReceipt.user_id == user_id,
        )
    )
    existing_ids = {row[0] for row in existing.all()}

    new_receipts = []
    for msg_id in message_ids:
        if msg_id not in existing_ids:
            receipt = MessageReadReceipt(message_id=msg_id, user_id=user_id)
            db.add(receipt)
            new_receipts.append(receipt)

    if new_receipts:
        await db.commit()
        for r in new_receipts:
            await db.refresh(r)

    return new_receipts


async def edit_message(
    message_id: UUID,
    new_content: str,
    user_id: UUID,
    db: AsyncSession,
) -> NegotiationMessage | None:
    """Edits a message (only by sender)."""
    msg_result = await db.execute(
        select(NegotiationMessage).where(NegotiationMessage.id == message_id)
    )
    msg = msg_result.scalar_one_or_none()
    if not msg:
        return None
    if msg.sender_id != user_id:
        raise ValueError("Can only edit your own messages")

    msg.content = new_content
    msg.edited_at = datetime.now(timezone.utc)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def delete_message(
    message_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> bool:
    """Deletes a message (only by sender)."""
    msg_result = await db.execute(
        select(NegotiationMessage).where(NegotiationMessage.id == message_id)
    )
    msg = msg_result.scalar_one_or_none()
    if not msg:
        return False
    if msg.sender_id != user_id:
        raise ValueError("Can only delete your own messages")

    await db.delete(msg)
    await db.commit()
    return True
