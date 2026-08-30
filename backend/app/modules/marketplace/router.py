from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.auth.models import CurrentUser
from app.modules.marketplace.models import Listing
from app.modules.provenance.models import ListingProvenanceSnapshot, ProvenanceRecord
from typing import List, Dict, Any

router = APIRouter(prefix="/marketplace", tags=["B2B Marketplace & Offerings"])

@router.post("/listings", response_model=Listing)
async def create_listing(
    title: str,
    price: float,
    unit: str,
    quantity: float,
    carbon_index: float,
    description: str | None = None,
    provenance_ids: List[str] | None = None,
    current_user: CurrentUser = Depends(require_role(["supplier", "manufacturer"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Publishes an available cargo batch or component line to the
    ecosystem-wide marketplace, complete with provenance tags.
    """
    listing = Listing(
        seller_id=current_user.organization_id,
        title=title,
        description=description,
        price=price,
        unit=unit,
        quantity_available=quantity,
        carbon_equivalent_index=carbon_index,
        status="active"
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    
    # Associate provenances if provided
    if provenance_ids:
        for p_id in provenance_ids:
            snapshot = ListingProvenanceSnapshot(
                listing_id=listing.id,
                provenance_id=p_id
            )
            db.add(snapshot)
        await db.commit()
        
    return listing

@router.get("/listings", response_model=List[Listing])
async def list_active_listings(
    db: AsyncSession = Depends(get_db)
):
    """Lists all active material offerings posted across BizzNet."""
    query = select(Listing).where(Listing.status == "active")
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/listings/{listing_id}", response_model=Dict[str, Any])
async def get_listing_details(
    listing_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves full specification card for an offering including verified ESG origin logs."""
    # Find Listing
    listing_query = select(Listing).where(Listing.id == listing_id)
    listing_result = await db.execute(listing_query)
    listing = listing_result.scalar_one_or_none()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found."
        )
        
    # Get associated provenance snap records
    snap_query = select(ProvenanceRecord).join(
        ListingProvenanceSnapshot, ListingProvenanceSnapshot.provenance_id == ProvenanceRecord.id
    ).where(ListingProvenanceSnapshot.listing_id == listing_id)
    
    snap_result = await db.execute(snap_query)
    provenances = snap_result.scalars().all()
    
    return {
        "listing": listing,
        "provenances": provenances
    }
