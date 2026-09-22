from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
# pyrefly: ignore [missing-import]
from app.modules.network.models import Organization, Facility, OrganizationCreate, FacilityCreate

# Counterpart visibility matrix from BACKEND_PLAN
COUNTERPART_MAPPING: dict[str, list[str]] = {
    "raw_material_supplier": ["manufacturer", "transporter", "auditor"],
    "manufacturer": ["raw_material_supplier", "distributor", "transporter", "auditor"],
    "distributor": ["manufacturer", "retailer", "transporter", "auditor"],
    "retailer": ["manufacturer", "distributor", "transporter", "auditor"],
    "transporter": ["raw_material_supplier", "manufacturer", "distributor", "retailer", "auditor"],
    "auditor": ["raw_material_supplier", "manufacturer", "distributor", "retailer", "transporter"],
    "admin": ["raw_material_supplier", "manufacturer", "distributor", "retailer", "transporter", "auditor"],
}

VALID_ROLES = set(COUNTERPART_MAPPING.keys())


async def register_organization(
    data: OrganizationCreate,
    user_id: str,
    db: AsyncSession,
) -> Organization:
    """Creates or updates an organization record linked to the Supabase auth user."""
    org = Organization(
        id=user_id,
        name=data.name,
        tax_id=data.tax_id,
        role=data.role,
        status="pending_verification",
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return org


async def get_counterparts(
    role: str,
    db: AsyncSession,
) -> list[Organization]:
    """Returns organizations whose roles are visible to the given role."""
    allowed_roles = COUNTERPART_MAPPING.get(role, [])
    query = select(Organization).where(
        Organization.role.in_(allowed_roles),
        Organization.status != "suspended",
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def register_facility(
    data: FacilityCreate,
    organization_id: str,
    db: AsyncSession,
) -> Facility:
    """Registers a facility (farm, refinery, warehouse) under an organization."""
    facility = Facility(
        organization_id=organization_id,
        name=data.name,
        location=data.location,
        carbon_intensity_factor=data.carbon_intensity_factor,
    )
    db.add(facility)
    await db.commit()
    await db.refresh(facility)
    return facility
