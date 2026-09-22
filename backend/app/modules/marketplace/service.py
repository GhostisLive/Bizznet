from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Optional
from uuid import UUID

from app.modules.marketplace.models import Listing, ListingCreate
from app.modules.provenance.models import ListingProvenanceSnapshot, ProvenanceRecord


async def create_listing(
    data: ListingCreate,
    organization_id: UUID,
    db: AsyncSession,
    provenance_record_ids: Optional[list[UUID]] = None,
) -> Listing:
    """Creates a marketplace listing and snapshots its provenance state."""
    listing = Listing(
        organization_id=organization_id,
        facility_id=data.facility_id,
        title=data.title,
        description=data.description,
        category=data.category,
        price=data.price,
        currency=data.currency,
        moq=data.moq,
        unit=data.unit,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)

    # Snapshot provenance state at listing creation
    if provenance_record_ids:
        for pid in provenance_record_ids:
            # Fetch the provenance record to get its grade
            rec_result = await db.execute(
                select(ProvenanceRecord).where(ProvenanceRecord.id == pid)
            )
            rec = rec_result.scalar_one_or_none()
            if rec:
                snapshot = ListingProvenanceSnapshot(
                    listing_id=listing.id,
                    confidence_score=0.0,
                    provenance_grade=rec.type,
                    active_provenance_records={"record_id": str(rec.id), "type": rec.type},
                )
                db.add(snapshot)
        await db.commit()

    return listing


async def list_listings(
    db: AsyncSession,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    max_moq: Optional[float] = None,
    provenance_grade: Optional[str] = None,
) -> list[Listing]:
    """Queries active listings with optional filters."""
    query = select(Listing).where(Listing.status == "active")

    if category:
        query = query.where(Listing.category == category)
    if min_price is not None:
        query = query.where(Listing.price >= min_price)
    if max_price is not None:
        query = query.where(Listing.price <= max_price)
    if max_moq is not None:
        query = query.where(Listing.moq <= max_moq)

    result = await db.execute(query)
    listings = list(result.scalars().all())

    # Filter by provenance grade if requested
    if provenance_grade and listings:
        listing_ids = [l.id for l in listings]
        snap_query = select(ListingProvenanceSnapshot).where(
            ListingProvenanceSnapshot.listing_id.in_(listing_ids),
            ListingProvenanceSnapshot.provenance_grade == provenance_grade,
        )
        snap_result = await db.execute(snap_query)
        matching_listing_ids = {s.listing_id for s in snap_result.scalars().all()}
        listings = [l for l in listings if l.id in matching_listing_ids]

    return listings


async def get_listing_detail(
    listing_id: UUID,
    db: AsyncSession,
) -> dict:
    """Returns a listing with its associated provenance records."""
    listing_result = await db.execute(
        select(Listing).where(Listing.id == listing_id)
    )
    listing = listing_result.scalar_one_or_none()
    if not listing:
        return {}

    # Get provenance snapshots
    snap_result = await db.execute(
        select(ListingProvenanceSnapshot).where(
            ListingProvenanceSnapshot.listing_id == listing_id
        )
    )
    snapshots = list(snap_result.scalars().all())

    return {"listing": listing, "provenance_snapshots": snapshots}
