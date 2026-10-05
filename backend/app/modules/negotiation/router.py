from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.modules.negotiation.models import (
    NegotiationCreate,
    NegotiationRead,
    BidCreate,
    BidRead,
    NegotiationMessageCreate,
    NegotiationMessageRead,
    MessageReadReceiptCreate,
    MessageReadReceiptRead,
)
from app.modules.negotiation import service
from app.modules.negotiation.models import Negotiation, NegotiationMessage

router = APIRouter(prefix="/negotiation", tags=["Negotiation Engine"])


@router.post("/initiate", response_model=NegotiationRead)
async def initiate_negotiation(
    data: NegotiationCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Opens a negotiation thread between buyer and listing seller."""
    result = await service.initiate_negotiation(
        data, current_user.organization_id, current_user.role, db
    )
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"],
        )
    return result["negotiation"]


@router.post("/{negotiation_id}/bid", response_model=BidRead)
async def submit_bid(
    negotiation_id: UUID,
    data: BidCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submits a structured offer containing target price, MOQ, and provenance requirement."""
    bid = await service.submit_bid(
        negotiation_id, data, current_user.organization_id, db
    )
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit bid. Negotiation not found or not active.",
        )
    return bid


@router.post("/{negotiation_id}/review-trace", response_model=NegotiationRead)
async def review_provenance_trace(
    negotiation_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Marks that the buyer has reviewed the provenance trace.
    Required before terms can be locked.
    """
    neg = await service.mark_provenance_reviewed(negotiation_id, db)
    if not neg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Negotiation not found or not active.",
        )
    return neg


@router.post("/{negotiation_id}/lock", response_model=NegotiationRead)
async def lock_negotiation(
    negotiation_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Locks terms when both parties agree on a bid state.
    Requires provenance review to be completed first.
    """
    result = await service.lock_terms(negotiation_id, db)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"],
        )
    return result["negotiation"]


@router.get("/negotiations", response_model=List[NegotiationRead])
async def get_my_negotiations(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists negotiation threads where the user is buyer or seller."""
    negotiations = await service.get_negotiations_for_user(
        current_user.organization_id, db
    )
    return negotiations


@router.get("/negotiations/enriched")
async def get_my_negotiations_enriched(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists negotiations with listing, organization, and bid data pre-joined.
    Replaces the frontend's direct Supabase enrichment queries.
    """
    negotiations = await service.get_enriched_negotiations(
        current_user.organization_id, db
    )
    return negotiations


@router.get("/{negotiation_id}/messages", response_model=List[NegotiationMessageRead])
async def get_negotiation_messages(
    negotiation_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gets all chat messages for a negotiation."""
    # Verify user is participant
    neg_result = await db.execute(
        select(Negotiation).where(Negotiation.id == negotiation_id)
    )
    neg = neg_result.scalar_one_or_none()
    if not neg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negotiation not found",
        )
    if neg.buyer_id != current_user.organization_id and neg.seller_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this negotiation",
        )

    messages = await service.get_messages(negotiation_id, db)
    return messages


@router.post("/{negotiation_id}/messages/read", response_model=list[MessageReadReceiptRead])
async def mark_messages_read(
    negotiation_id: UUID,
    data: MessageReadReceiptCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Marks messages as read by the current user."""
    # Verify user is participant
    neg_result = await db.execute(
        select(Negotiation).where(Negotiation.id == negotiation_id)
    )
    neg = neg_result.scalar_one_or_none()
    if not neg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Negotiation not found",
        )
    if neg.buyer_id != current_user.organization_id and neg.seller_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this negotiation",
        )

    receipts = await service.mark_messages_read_batch(
        [data.message_id], current_user.organization_id, db
    )
    return receipts


@router.patch("/messages/{message_id}", response_model=NegotiationMessageRead)
async def edit_negotiation_message(
    message_id: UUID,
    data: NegotiationMessageCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edits a message (only by sender)."""
    try:
        msg = await service.edit_message(message_id, data.content, current_user.organization_id, db)
        if not msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )
        return msg
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_negotiation_message(
    message_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a message (only by sender)."""
    try:
        deleted = await service.delete_message(message_id, current_user.organization_id, db)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{negotiation_id}/messages", response_model=NegotiationMessageRead)
async def send_negotiation_message(
    negotiation_id: UUID,
    data: NegotiationMessageCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sends a chat message in a negotiation."""
    try:
        msg = await service.send_message(
            negotiation_id, data, current_user.organization_id, db
        )
        return msg
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

