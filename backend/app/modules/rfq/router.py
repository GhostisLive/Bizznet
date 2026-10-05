from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.modules.rfq import service
from app.modules.rfq.models import (
    RFQ,
    RFQBid,
    RFQCreate,
    RFQBidCreate,
)

router = APIRouter(prefix="/rfq", tags=["RFQs"])


@router.post("/rfqs", response_model=RFQ)
async def create_rfq(
    data: RFQCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new Request for Quote."""
    rfq = await service.create_rfq(data, current_user.organization_id, db)
    return rfq


@router.get("/rfqs", response_model=List[RFQ])
async def list_rfqs(
    category: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    buyer_id: Optional[UUID] = Query(default=None),
    supplier_id: Optional[UUID] = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List RFQs with optional filters.
    Business logic: Suppliers see only RFQs they can bid on.
    """
    rfqs = await service.list_rfqs(
        db=db,
        category=category,
        status=status,
        buyer_id=buyer_id,
        supplier_id=supplier_id,
    )
    return rfqs


@router.get("/rfqs/{rfq_id}", response_model=RFQ)
async def get_rfq(
    rfq_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get RFQ details."""
    rfq = await service.get_rfq_detail(rfq_id, db)
    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFQ not found",
        )
    return rfq


@router.patch("/rfqs/{rfq_id}/status")
async def update_rfq_status(
    rfq_id: UUID,
    new_status: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update RFQ status (only buyer can update)."""
    # Verify ownership
    rfq = await service.get_rfq_detail(rfq_id, db)
    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFQ not found",
        )
    
    if rfq.buyer_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the buyer can update RFQ status",
        )
    
    updated_rfq = await service.update_rfq_status(rfq_id, new_status, db)
    return {"message": "RFQ status updated successfully", "rfq": updated_rfq}


@router.post("/rfqs/{rfq_id}/bids", response_model=RFQBid)
async def submit_rfq_bid(
    rfq_id: UUID,
    data: RFQBidCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a bid on an RFQ."""
    # Verify RFQ exists and is open
    rfq = await service.get_rfq_detail(rfq_id, db)
    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFQ not found",
        )
    
    if rfq.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RFQ is not open for bidding",
        )
    
    bid = await service.create_rfq_bid(
        rfq_id, current_user.organization_id, data, db
    )
    return bid


@router.get("/rfqs/{rfq_id}/bids", response_model=List[RFQBid])
async def list_rfq_bids(
    rfq_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all bids on an RFQ."""
    bids = await service.list_rfq_bids(rfq_id, db)
    return bids


@router.get("/rfqs/{rfq_id}/statistics")
async def get_rfq_statistics(
    rfq_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get bid statistics for an RFQ."""
    # Verify RFQ exists
    rfq = await service.get_rfq_detail(rfq_id, db)
    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFQ not found",
        )
    
    stats = await service.get_rfq_statistics(rfq_id, db)
    return stats


@router.patch("/rfqs/{rfq_id}/bids/{bid_id}/status")
async def update_bid_status(
    rfq_id: UUID,
    bid_id: UUID,
    new_status: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update bid status (shortlist, award, reject) - only buyer can do this."""
    # Verify RFQ ownership
    rfq = await service.get_rfq_detail(rfq_id, db)
    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFQ not found",
        )
    
    if rfq.buyer_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the buyer can update bid status",
        )
    
    bid = await service.update_bid_status(bid_id, new_status, db)
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found",
        )
    
    return {"message": "Bid status updated", "bid": bid}


@router.get("/my-bids", response_model=List[RFQBid])
async def get_my_bids(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all bids submitted by the current user's organization."""
    bids = await service.list_rfq_bids(
        rfq_id=None,
        db=db,
        supplier_id=current_user.organization_id,
    )
    return bids
