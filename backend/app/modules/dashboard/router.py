from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.modules.dashboard import service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview")
async def get_dashboard_overview(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get comprehensive dashboard overview.
    Returns aggregated statistics from orders, listings, negotiations, and RFQs.
    """
    overview = await service.get_dashboard_overview(
        current_user.organization_id,
        db,
    )
    return overview


@router.get("/revenue-trends")
async def get_revenue_trends(
    days: int = Query(default=30, ge=1, le=365),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get revenue trends over time.
    Business logic: Aggregates order revenue by date.
    """
    trends = await service.get_revenue_trends(
        current_user.organization_id,
        db,
        days=days,
    )
    return trends
