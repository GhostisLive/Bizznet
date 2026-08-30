from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.modules.network.models import Organization, Facility
from typing import List

router = APIRouter(prefix="/network", tags=["Network & Onboarding"])

# Counterpart visibility logic by role
COUNTERPART_MAPPING = {
    "supplier": ["manufacturer", "transporter", "auditor"],
    "manufacturer": ["supplier", "distributor", "transporter", "auditor"],
    "distributor": ["manufacturer", "retailer", "transporter", "auditor"],
    "retailer": ["manufacturer", "distributor", "transporter", "auditor"],
    "transporter": ["supplier", "manufacturer", "distributor", "retailer", "auditor"],
    "auditor": ["supplier", "manufacturer", "distributor", "retailer", "transporter"],
    "admin": ["supplier", "manufacturer", "distributor", "retailer", "transporter", "auditor"]
}

@router.get("/counterparts", response_model=List[Organization])
async def get_counterparts(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns verified trading partner organization profiles matched
    to your specific role's supply chain boundaries.
    """
    allowed_roles = COUNTERPART_MAPPING.get(current_user.role, [])
    
    query = select(Organization).where(Organization.role.in_(allowed_roles))
    result = await db.execute(query)
    partners = result.scalars().all()
    return partners

@router.post("/register-facility", response_model=Facility)
async def register_facility(
    name: str,
    carbon_factor: float,
    location_details: dict | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows organizations to register local logistics or storage sites."""
    facility = Facility(
        organization_id=current_user.organization_id,
        name=name,
        location=location_details,
        carbon_intensity_factor=carbon_factor
    )
    db.add(facility)
    await db.commit()
    await db.refresh(facility)
    return facility
