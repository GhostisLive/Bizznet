from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
# pyrefly: ignore [missing-import]
from app.modules.network.models import Organization, Facility, OrganizationCreate, FacilityCreate

# Counterparts whose listings a role may discover and negotiate with.
MARKETPLACE_SELLER_ROLES: dict[str, list[str]] = {
    "raw_material_supplier": ["distributor", "transporter"],
    "manufacturer": [
        "raw_material_supplier",
        "distributor",
        "transporter",
        "retailer",
    ],
    "distributor": ["manufacturer", "retailer"],
    "transporter": [
        "manufacturer",
        "distributor",
        "retailer",
        "raw_material_supplier",
    ],
    "retailer": ["manufacturer", "transporter", "distributor"],
    "auditor": [],
    "admin": [],
}
ROLE_ALIASES = {"supplier": "raw_material_supplier"}

# Counterpart visibility for the network directory follows the same trading
# relationships; auditors and admins retain broad operational visibility.
COUNTERPART_MAPPING: dict[str, list[str]] = {
    "raw_material_supplier": ["distributor", "transporter"],
    "manufacturer": [
        "raw_material_supplier",
        "distributor",
        "transporter",
        "retailer",
    ],
    "distributor": ["manufacturer", "retailer"],
    "transporter": [
        "manufacturer",
        "distributor",
        "retailer",
        "raw_material_supplier",
    ],
    "retailer": ["manufacturer", "transporter", "distributor"],
    "auditor": [],
    "admin": [],
}

VALID_ROLES = set(MARKETPLACE_SELLER_ROLES.keys())


def normalize_role(role: str | None) -> str:
    value = (role or "manufacturer").strip().lower()
    return ROLE_ALIASES.get(value, value)


def role_variants(role: str) -> list[str]:
    return [role, "supplier"] if role == "raw_material_supplier" else [role]


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
        role=normalize_role(data.role),
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
    allowed_roles = COUNTERPART_MAPPING.get(normalize_role(role), [])
    allowed_roles = [
        variant
        for allowed_role in allowed_roles
        for variant in role_variants(allowed_role)
    ]
    query = select(Organization).where(
        Organization.role.in_(allowed_roles),
        Organization.status != "suspended",
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_organization(
    org_id: str,
    db: AsyncSession,
) -> Optional[Organization]:
    """Get an organization by ID."""
    query = select(Organization).where(Organization.id == org_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def list_facilities(
    organization_id: str,
    db: AsyncSession,
) -> list[Facility]:
    """List all facilities registered under an organization."""
    query = (
        select(Facility)
        .where(Facility.organization_id == organization_id)
        .order_by(Facility.created_at.desc())
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
