from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.modules.products import service
from app.modules.products.models import ProductCreate, ProductUpdate, ProductRead, ProductWithListing

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[dict])
async def get_products(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all products for the current organization.
    Returns products with listing status enrichment.
    """
    products = await service.get_products(current_user.organization_id, db)
    return products


@router.post("", response_model=ProductRead)
async def create_product(
    data: ProductCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new product."""
    product = await service.create_product(data, current_user.organization_id, db)
    return product


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a product (only owner can update)."""
    product = await service.update_product(
        product_id, data, current_user.organization_id, db
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or access denied",
        )
    return product


@router.delete("/{product_id}")
async def delete_product(
    product_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a product and its associated listing."""
    result = await service.delete_product(product_id, current_user.organization_id, db)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"],
        )
    return result


@router.post("/{product_id}/sync-listing")
async def sync_to_listing(
    product_id: UUID,
    facility_id: Optional[UUID] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Sync product to marketplace listing.
    Creates new listing or updates existing one.
    """
    result = await service.sync_product_to_listing(
        product_id, current_user.organization_id, facility_id, db
    )
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"],
        )
    return result


@router.post("/{product_id}/withdraw-listing")
async def withdraw_listing(
    product_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Withdraw product from marketplace (sets status to withdrawn)."""
    result = await service.withdraw_listing(
        product_id, current_user.organization_id, db
    )
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"],
        )
    return result
