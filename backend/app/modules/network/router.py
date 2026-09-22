from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# pyrefly: ignore [missing-import]
from app.database import get_db
# pyrefly: ignore [missing-import]
from app.dependencies import get_current_user
# pyrefly: ignore [missing-import]
from app.auth.models import CurrentUser
# pyrefly: ignore [missing-import]
from app.modules.network.models import (
    OrganizationCreate,
    OrganizationRead,
    FacilityCreate,
    FacilityRead,
)
# pyrefly: ignore [missing-import]
from app.modules.network import service

router = APIRouter(prefix="/network", tags=["Network & Onboarding"])


@router.post("/register", response_model=OrganizationRead)
async def register_organization(
    data: OrganizationCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Registers organization attributes and assigns supply-chain role context."""
    # pyrefly: ignore [missing-import]
    from app.modules.network.service import VALID_ROLES

    if data.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {sorted(VALID_ROLES)}",
        )

    org = await service.register_organization(data, str(current_user.id), db)
    return org


@router.get("/counterparts", response_model=List[OrganizationRead])
async def get_counterparts(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Dynamically lists potential matching organizations within compatible
    sectors based on the current user's supply-chain role.
    """
    partners = await service.get_counterparts(current_user.role, db)
    return partners


@router.post("/register-facility", response_model=FacilityRead)
async def register_facility(
    data: FacilityCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Registers a facility (farm, refinery, warehouse) under the user's organization."""
    facility = await service.register_facility(
        data, str(current_user.organization_id), db
    )
    return facility
