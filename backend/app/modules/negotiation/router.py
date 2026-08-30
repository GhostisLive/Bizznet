from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.modules.negotiation.models import Negotiation, NegotiationBid
from app.modules.marketplace.models import Listing
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/negotiation", tags=["Private Contract Negotiations"])

@router.post("/negotiations", response_model=Negotiation)
async def initiate_negotiation(
    listing_id: str,
    initial_price: float,
    initial_quantity: float,
    terms_yaml: str | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initiates a contract negotiation channel on an offering."""
    # Find Listing
    listing_query = select(Listing).where(Listing.id == listing_id)
    listing_result = await db.execute(listing_query)
    listing = listing_result.scalar_one_or_none()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source listing material code not found."
        )
        
    # Start negotiation
    neg = Negotiation(
        listing_id=listing.id,
        buyer_id=current_user.organization_id,
        status="initiated"
    )
    db.add(neg)
    await db.commit()
    await db.refresh(neg)
    
    # Save the initial bid
    bid = NegotiationBid(
        negotiation_id=neg.id,
        sender_id=current_user.organization_id,
        price_proposed=initial_price,
        quantity_proposed=initial_quantity,
        terms_yaml=terms_yaml
    )
    db.add(bid)
    await db.commit()
    
    return neg

@router.post("/negotiations/{negotiation_id}/bid", response_model=NegotiationBid)
async def submit_bid(
    negotiation_id: str,
    price_proposed: float,
    quantity_proposed: float,
    terms_yaml: str | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submits a pricing/delivery terms counterproposal bid."""
    neg_query = select(Negotiation).where(Negotiation.id == negotiation_id)
    neg_result = await db.execute(neg_query)
    neg = neg_result.scalar_one_or_none()
    
    if not neg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active contract negotiation channel not found."
        )
        
    if neg.status in ["agreed", "cancelled", "shipped"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot place bids on negotiation with finalized state: {neg.status}"
        )
        
    bid = NegotiationBid(
        negotiation_id=neg.id,
        sender_id=current_user.organization_id,
        price_proposed=price_proposed,
        quantity_proposed=quantity_proposed,
        terms_yaml=terms_yaml
    )
    
    db.add(bid)
    await db.commit()
    await db.refresh(bid)
    return bid

@router.post("/negotiations/{negotiation_id}/lock", response_model=Negotiation)
async def lock_negotiation(
    negotiation_id: str,
    final_price: float,
    final_quantity: float,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Locks agreement terms and signs contract escrow."""
    neg_query = select(Negotiation).where(Negotiation.id == negotiation_id)
    neg_result = await db.execute(neg_query)
    neg = neg_result.scalar_one_or_none()
    
    if not neg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract negotiation channel not found."
        )
        
    neg.status = "agreed"
    neg.final_price = final_price
    neg.final_quantity = final_quantity
    neg.locked_at = datetime.utcnow()
    
    db.add(neg)
    await db.commit()
    await db.refresh(neg)
    return neg

@router.get("/negotiations", response_model=List[Negotiation])
async def get_my_negotiations(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists negotiation channels associated with your organization."""
    # Find matching listing ids owned by user
    sub_query = select(Listing.id).where(Listing.seller_id == current_user.organization_id)
    listing_ids_result = await db.execute(sub_query)
    owned_listing_ids = listing_ids_result.scalars().all()
    
    # Matches where user is buyer or seller
    query = select(Negotiation).where(
        (Negotiation.buyer_id == current_user.organization_id) |
        (Negotiation.listing_id.in_(owned_listing_ids))
    )
    
    result = await db.execute(query)
    return result.scalars().all()
