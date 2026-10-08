from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import desc

from app.modules.negotiation.models import (
    Negotiation,
    NegotiationBid,
    NegotiationMessage,
    MessageReadReceipt,
    NegotiationCreate,
    BidCreate,
    NegotiationMessageCreate,
    NegotiationDocument,
)
from app.modules.marketplace.models import Listing
from app.modules.network.models import Organization
from app.modules.network.service import MARKETPLACE_SELLER_ROLES, normalize_role
from app.modules.negotiation.document_service import generate_agreement, utc_document_date
from app.config import settings


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


async def get_negotiation_detail(
    negotiation_id: UUID,
    db: AsyncSession,
) -> Negotiation | None:
    result = await db.execute(
        select(Negotiation).where(Negotiation.id == negotiation_id)
    )
    return result.scalar_one_or_none()


async def get_latest_bid(
    negotiation_id: UUID,
    sender_id: UUID,
    db: AsyncSession,
) -> NegotiationBid | None:
    result = await db.execute(
        select(NegotiationBid)
        .where(
            NegotiationBid.negotiation_id == negotiation_id,
            NegotiationBid.sender_id == sender_id,
        )
        .order_by(desc(NegotiationBid.created_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_negotiation_document(
    negotiation_id: UUID,
    db: AsyncSession,
) -> NegotiationDocument | None:
    result = await db.execute(
        select(NegotiationDocument)
        .where(NegotiationDocument.negotiation_id == negotiation_id)
        .order_by(desc(NegotiationDocument.created_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def accept_offer(
    negotiation_id: UUID,
    accepting_org_id: UUID,
    db: AsyncSession,
) -> tuple[Negotiation, NegotiationDocument]:
    """Accept the counterparty's latest terms and create an agreement record."""
    neg = await get_negotiation_detail(negotiation_id, db)
    if not neg:
        raise ValueError("Negotiation not found")
    if accepting_org_id not in (neg.buyer_id, neg.seller_id):
        raise ValueError("Not a participant in this negotiation")
    if neg.status not in ("active", "countered", "agreed"):
        raise ValueError(f"Cannot accept a negotiation with status: {neg.status}")
    if neg.status == "agreed":
        existing_document = await get_negotiation_document(negotiation_id, db)
        if existing_document:
            return neg, existing_document

    listing_result = await db.execute(select(Listing).where(Listing.id == neg.listing_id))
    listing = listing_result.scalar_one_or_none()
    if not listing:
        raise ValueError("Listing not found")

    buyer_result = await db.execute(select(Organization).where(Organization.id == neg.buyer_id))
    seller_result = await db.execute(select(Organization).where(Organization.id == neg.seller_id))
    buyer = buyer_result.scalar_one_or_none()
    seller = seller_result.scalar_one_or_none()
    if not buyer or not seller:
        raise ValueError("Negotiation parties could not be resolved")

    if accepting_org_id == neg.seller_id:
        accepted_bid = await get_latest_bid(negotiation_id, neg.buyer_id, db)
        if not accepted_bid:
            raise ValueError("There is no buyer offer to accept")
    else:
        accepted_bid = await get_latest_bid(negotiation_id, neg.seller_id, db)

    accepted_price = accepted_bid.price if accepted_bid else listing.price
    accepted_moq = accepted_bid.moq if accepted_bid else listing.moq
    accepted_terms = accepted_bid.terms if accepted_bid else None
    document_number = f"BZN-{datetime.now(timezone.utc):%Y%m%d}-{str(negotiation_id)[:8].upper()}"

    neg.status = "agreed"
    neg.accepted_price = accepted_price
    neg.accepted_moq = accepted_moq
    neg.accepted_by = accepting_org_id
    neg.accepted_at = datetime.now(timezone.utc)
    db.add(neg)
    await db.commit()
    await db.refresh(neg)

    snapshot = {
        "document_number": document_number,
        "effective_date": utc_document_date(),
        "buyer_name": buyer.name,
        "buyer_role": buyer.role,
        "seller_name": seller.name,
        "seller_role": seller.role,
        "product": listing.title,
        "category": listing.category or "Not specified",
        "moq": accepted_moq,
        "unit": listing.unit,
        "unit_price": accepted_price,
        "estimated_value": accepted_price * accepted_moq,
        "currency": listing.currency,
        "provenance_requirement": accepted_bid.provenance_requirement if accepted_bid else "Not specified",
        "additional_terms": accepted_terms or "To be confirmed in the purchase order",
    }
    content, source, generation_error = await generate_agreement(snapshot)
    document = NegotiationDocument(
        negotiation_id=neg.id,
        document_number=document_number,
        title=f"Commercial Agreement - {listing.title}",
        content_markdown=content,
        terms_snapshot=snapshot,
        generation_source=source,
        ai_model=settings.OLLAMA_MODEL if source == "ollama" else None,
        generation_error=generation_error,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return neg, document


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
            "accepted_price": neg.accepted_price,
            "accepted_moq": neg.accepted_moq,
            "accepted_by": str(neg.accepted_by) if neg.accepted_by else None,
            "accepted_at": neg.accepted_at.isoformat() if neg.accepted_at else None,
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
                    "created_at": b.created_at.isoformat(),
                    "timestamp": b.created_at.isoformat(),
                }
                for b in bids
            ],
            "document": (
                {
                    "id": str(document.id),
                    "negotiation_id": str(document.negotiation_id),
                    "document_type": document.document_type,
                    "document_number": document.document_number,
                    "title": document.title,
                    "content_markdown": document.content_markdown,
                    "terms_snapshot": document.terms_snapshot,
                    "generation_source": document.generation_source,
                    "ai_model": document.ai_model,
                    "generation_error": document.generation_error,
                    "created_at": document.created_at.isoformat(),
                }
                if (document := await get_negotiation_document(neg.id, db))
                else None
            ),
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
