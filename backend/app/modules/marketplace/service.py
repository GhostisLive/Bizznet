from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID

from app.modules.marketplace.models import Listing
from app.modules.network.models import Organization
from app.modules.network.service import (
    MARKETPLACE_SELLER_ROLES,
    normalize_role,
    role_variants,
)


async def get_marketplace_listings(
    db: AsyncSession,
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    provenance_filter: Optional[str] = None,
    viewer_role: Optional[str] = None,
) -> List[dict]:
    """
    Fetch all active marketplace listings with enriched data.
    Business logic: filtering, searching, and data enrichment.
    """
    query = select(Listing).where(Listing.status == "active")
    if viewer_role:
        viewer_role = normalize_role(viewer_role)
        allowed_roles = [
            variant
            for role in MARKETPLACE_SELLER_ROLES.get(viewer_role, [])
            for variant in role_variants(role)
        ]
        query = query.join(
            Organization, Organization.id == Listing.organization_id
        ).where(Organization.role.in_(allowed_roles))
    
    # Apply filters
    if category:
        query = query.where(Listing.category == category)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Listing.title.ilike(search_pattern)) | 
            (Listing.description.ilike(search_pattern))
        )
    
    if min_price is not None:
        query = query.where(Listing.price >= min_price)
    
    if max_price is not None:
        query = query.where(Listing.price <= max_price)
    
    query = query.order_by(Listing.created_at.desc())
    
    result = await db.execute(query)
    listings = result.scalars().all()
    
    # Enrich listings with related data
    enriched = []
    for listing in listings:
        enriched_listing = await _enrich_listing(listing, db)
        
        # Apply provenance filter if specified
        if provenance_filter and provenance_filter != "all":
            if enriched_listing.get("provenance_grade", "").lower() != provenance_filter.lower():
                continue
        
        enriched.append(enriched_listing)
    
    return enriched


async def get_listing_detail(
    listing_id: UUID,
    db: AsyncSession,
    viewer_role: Optional[str] = None,
) -> Optional[dict]:
    """Get detailed information about a specific listing."""
    query = select(Listing).where(Listing.id == listing_id)
    if viewer_role:
        viewer_role = normalize_role(viewer_role)
        allowed_roles = [
            variant
            for role in MARKETPLACE_SELLER_ROLES.get(viewer_role, [])
            for variant in role_variants(role)
        ]
        query = query.join(
            Organization, Organization.id == Listing.organization_id
        ).where(Organization.role.in_(allowed_roles))
    result = await db.execute(query)
    listing = result.scalar_one_or_none()
    
    if not listing:
        return None
    
    return await _enrich_listing(listing, db)


async def get_recommendations(
    organization_id: UUID,
    db: AsyncSession,
) -> dict:
    """
    Get personalized recommendations based on organization role.
    Business logic for role-based recommendations.
    """
    # Get organization details
    org_result = await db.execute(
        select(Organization).where(Organization.id == organization_id)
    )
    org = org_result.scalar_one_or_none()
    
    if not org:
        return {
            "recommendations": [],
            "label": "Recommended for You",
            "description": "No recommendations available",
        }
    
    # Keep recommendations subject to the same visibility policy as the
    # marketplace listing endpoint.
    query = select(Listing).where(Listing.status == "active")
    
    label = "Recommended for You"
    description = "Top picks based on your business profile"
    
    role_copy = {
        "manufacturer": (
            "Raw Materials for Manufacturing",
            "Sourced from verified suppliers for your production lines",
        ),
        "retailer": (
            "Products to Stock",
            "Finished goods from distributors and manufacturers",
        ),
        "distributor": (
            "Products to Distribute",
            "Bulk finished goods ready for onward sale",
        ),
        "raw_material_supplier": (
            "Distributor & Logistics Listings",
            "Relevant downstream and transport partners",
        ),
        "transporter": (
            "Supply Chain Listings",
            "Organizations connected to your logistics network",
        ),
    }
    if org.role in role_copy:
        label, description = role_copy[org.role]
        query = query.where(
            Listing.organization_id.in_(
                select(Organization.id).where(
                    Organization.role.in_(
                        [
                            variant
                            for role in MARKETPLACE_SELLER_ROLES[org.role]
                            for variant in role_variants(role)
                        ]
                    )
                )
            )
        )
    else:
        query = query.where(False)
    
    query = query.limit(10).order_by(Listing.created_at.desc())
    
    result = await db.execute(query)
    listings = result.scalars().all()
    
    enriched = [await _enrich_listing(listing, db) for listing in listings]
    
    return {
        "recommendations": enriched,
        "label": label,
        "description": description,
    }


async def _enrich_listing(listing: Listing, db: AsyncSession) -> dict:
    """
    Enrich a listing with related data (organization, facility, provenance).
    Business logic for data enrichment and calculation.
    """
    from app.modules.network.models import Organization, Facility
    from app.modules.provenance.models import ProvenanceRecord
    
    # Get organization
    org_result = await db.execute(
        select(Organization).where(Organization.id == listing.organization_id)
    )
    org = org_result.scalar_one_or_none()
    
    # Get facility if exists
    facility = None
    if listing.facility_id:
        facility_result = await db.execute(
            select(Facility).where(Facility.id == listing.facility_id)
        )
        facility = facility_result.scalar_one_or_none()
    
    # Get provenance records
    prov_result = await db.execute(
        select(ProvenanceRecord)
        .where(ProvenanceRecord.organization_id == listing.organization_id)
        .order_by(ProvenanceRecord.created_at.desc())
        .limit(5)
    )
    provenance_records = list(prov_result.scalars().all())
    
    # Calculate provenance grade
    provenance_grade = "self_reported"
    confidence_score = 50
    
    if provenance_records:
        verified_count = sum(1 for p in provenance_records if p.type == "verified")
        audited_count = sum(1 for p in provenance_records if p.type == "audited")
        
        if verified_count >= 3:
            provenance_grade = "verified"
            confidence_score = 90
        elif audited_count >= 2:
            provenance_grade = "audited"
            confidence_score = 70
        elif verified_count + audited_count >= 1:
            provenance_grade = "audited"
            confidence_score = 65
    
    # Calculate carbon intensity
    carbon_intensity = 2.1  # Default
    if facility and hasattr(facility, 'carbon_intensity_factor'):
        carbon_intensity = facility.carbon_intensity_factor
    
    # Build location string
    location = "Location not specified"
    if facility and facility.location:
        if isinstance(facility.location, dict):
            city = facility.location.get("city", "")
            state = facility.location.get("state", "")
            location = f"{city}, {state}" if city else state
        else:
            location = str(facility.location)
    
    return {
        "id": str(listing.id),
        "title": listing.title,
        "description": listing.description,
        "category": listing.category,
        "price": listing.price,
        "currency": listing.currency,
        "moq": listing.moq,
        "unit": listing.unit,
        "status": listing.status,
        "created_at": listing.created_at.isoformat(),
        "organization_id": str(listing.organization_id),
        "facility_id": str(listing.facility_id) if listing.facility_id else None,
        # Enriched data
        "supplier": org.name if org else "Unknown Seller",
        "seller_role": normalize_role(org.role if org else None),
        "provenance_grade": provenance_grade,
        "confidence_score": confidence_score,
        "provenance_record_count": len(provenance_records),
        "carbon_intensity": carbon_intensity,
        "location": location,
        "facility_name": facility.name if facility else None,
    }
