from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.modules.marketplace.models import Listing, ListingRead, ListingWithDetails

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/listings", response_model=List[ListingWithDetails])
async def get_marketplace_listings(
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    provenance_filter: Optional[str] = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all active marketplace listings with enriched data.
    Includes organization info, facility details, and provenance data.
    """
    from app.modules.marketplace import service
    
    listings = await service.get_marketplace_listings(
        db=db,
        category=category,
        search=search,
        min_price=min_price,
        max_price=max_price,
        provenance_filter=provenance_filter,
        viewer_role=current_user.role,
    )
    
    return listings


@router.get("/listings/{listing_id}", response_model=ListingWithDetails)
async def get_listing_detail(
    listing_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed information about a specific listing."""
    from app.modules.marketplace import service
    
    listing = await service.get_listing_detail(
        listing_id, db, viewer_role=current_user.role
    )
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )
    
    return listing


@router.get("/recommendations")
async def get_recommendations(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get personalized recommendations based on user's organization role.
    """
    from app.modules.marketplace import service
    
    recommendations = await service.get_recommendations(
        organization_id=current_user.organization_id,
        db=db,
    )
    
    return recommendations
