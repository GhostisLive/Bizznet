from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.auth.models import CurrentUser
from app.modules.marketplace.models import ListingCreate, ListingRead
from app.modules.marketplace import service

router = APIRouter(prefix="/marketplace", tags=["B2B Marketplace"])


@router.post("/listings", response_model=ListingRead)
async def create_listing(
    data: ListingCreate,
    provenance_record_ids: Optional[List[UUID]] = Query(default=None),
    current_user: CurrentUser = Depends(
        require_role(["raw_material_supplier", "manufacturer"])
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a material or finished goods entry on the marketplace.
    Optionally attaches provenance records as listing snapshots.
    """
    listing = await service.create_listing(
        data, current_user.organization_id, db, provenance_record_ids
    )
    return listing


@router.get("/listings", response_model=List[ListingRead])
async def list_active_listings(
    category: Optional[str] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    max_moq: Optional[float] = Query(default=None),
    provenance_grade: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    Queries active marketplace listings with filter parameters:
    category, price range, MOQ ceiling, and provenance grade.
    """
    listings = await service.list_listings(
        db,
        category=category,
        min_price=min_price,
        max_price=max_price,
        max_moq=max_moq,
        provenance_grade=provenance_grade,
    )
    return listings


@router.get("/listings/{listing_id}")
async def get_listing_details(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves listing details including verified ESG provenance snapshots."""
    result = await service.get_listing_detail(listing_id, db)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found.",
        )
    return result
