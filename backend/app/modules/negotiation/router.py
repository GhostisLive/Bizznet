from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
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
)
from app.modules.negotiation import service

router = APIRouter(prefix="/negotiation", tags=["Negotiation Engine"])


@router.post("/initiate", response_model=NegotiationRead)
async def initiate_negotiation(
    data: NegotiationCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Opens a negotiation thread between buyer and listing seller."""
    result = await service.initiate_negotiation(
        data, current_user.organization_id, db
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
