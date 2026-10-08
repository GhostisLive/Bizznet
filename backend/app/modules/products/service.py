from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update as sql_update, delete as sql_delete
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from app.modules.products.models import Product, ProductCreate, ProductUpdate
from app.modules.marketplace.models import Listing, ListingCreate


async def get_products(organization_id: UUID, db: AsyncSession) -> List[dict]:
    """
    Get all products for an organization with listing status.
    Business logic: Enriches product data with listing information.
    """
    result = await db.execute(
        select(Product)
        .where(Product.organization_id == organization_id)
        .order_by(Product.created_at.desc())
    )
    products = result.scalars().all()
    
    # Enrich with listing status
    enriched = []
    for product in products:
        product_dict = {
            "id": str(product.id),
            "organization_id": str(product.organization_id),
            "name": product.name,
            "description": product.description,
            "category": product.category,
            "unit_price": product.unit_price,
            "moq": product.moq,
            "unit": product.unit,
            "stock": product.stock,
            "stock_location": product.stock_location,
            "status": product.status,
            "is_listed_on_marketplace": product.is_listed_on_marketplace,
            "listing_id": str(product.listing_id) if product.listing_id else None,
            "created_at": product.created_at.isoformat(),
            "updated_at": product.updated_at.isoformat(),
            "listing_status": "not_listed",
        }
        
        # Get listing status if exists
        if product.listing_id:
            listing_result = await db.execute(
                select(Listing).where(Listing.id == product.listing_id)
            )
            listing = listing_result.scalar_one_or_none()
            if listing:
                product_dict["listing_status"] = listing.status
        
        enriched.append(product_dict)
    
    return enriched


async def create_product(
    data: ProductCreate,
    organization_id: UUID,
    db: AsyncSession,
) -> Product:
    """Create a new product."""
    product = Product(
        organization_id=organization_id,
        **data.model_dump(),
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    organization_id: UUID,
    db: AsyncSession,
) -> Optional[Product]:
    """
    Update a product.
    Business logic: Only owner can update, auto-update timestamp.
    """
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .where(Product.organization_id == organization_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        return None
    
    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    product.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(
    product_id: UUID,
    organization_id: UUID,
    db: AsyncSession,
) -> dict:
    """
    Delete a product and its associated listing.
    Business logic: Cascade delete listing if exists.
    """
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .where(Product.organization_id == organization_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        return {"error": "Product not found or access denied"}
    
    # Delete associated listing first
    if product.listing_id:
        await db.execute(
            sql_delete(Listing).where(Listing.id == product.listing_id)
        )
    
    # Delete product
    await db.execute(
        sql_delete(Product).where(Product.id == product_id)
    )
    
    await db.commit()
    return {"message": "Product deleted successfully"}


async def sync_product_to_listing(
    product_id: UUID,
    organization_id: UUID,
    facility_id: Optional[UUID],
    db: AsyncSession,
) -> dict:
    """
    Sync product to marketplace listing.
    Business logic:
    - Creates listing if not exists
    - Updates listing if exists
    - Handles status changes (active/withdrawn)
    """
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .where(Product.organization_id == organization_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        return {"error": "Product not found or access denied"}
    
    listing_data = {
        "title": product.name,
        "description": product.description,
        "category": product.category,
        "price": product.unit_price,
        "moq": product.moq,
        "unit": product.unit,
        "organization_id": organization_id,
        "facility_id": facility_id,
        "status": "active",
    }
    
    if product.listing_id:
        # Update existing listing
        await db.execute(
            sql_update(Listing)
            .where(Listing.id == product.listing_id)
            .values(**listing_data)
        )
        await db.execute(
            sql_update(Product)
            .where(Product.id == product_id)
            .values(
                is_listed_on_marketplace=True,
                updated_at=datetime.now(timezone.utc),
            )
        )
        await db.commit()
        
        return {
            "message": "Listing updated successfully",
            "listing_id": str(product.listing_id),
            "action": "updated",
        }
    else:
        # Create new listing
        listing = Listing(**listing_data)
        db.add(listing)
        await db.commit()
        await db.refresh(listing)
        
        # Update product with listing_id
        await db.execute(
            sql_update(Product)
            .where(Product.id == product_id)
            .values(
                listing_id=listing.id,
                is_listed_on_marketplace=True,
                updated_at=datetime.now(timezone.utc),
            )
        )
        await db.commit()
        
        return {
            "message": "Listing created successfully",
            "listing_id": str(listing.id),
            "action": "created",
        }


async def withdraw_listing(
    product_id: UUID,
    organization_id: UUID,
    db: AsyncSession,
) -> dict:
    """
    Withdraw product from marketplace.
    Business logic: Sets listing status to withdrawn, keeps link.
    """
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .where(Product.organization_id == organization_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        return {"error": "Product not found or access denied"}
    
    if not product.listing_id:
        return {"error": "Product has no active listing"}
    
    # Update listing status to withdrawn
    await db.execute(
        sql_update(Listing)
        .where(Listing.id == product.listing_id)
        .values(status="withdrawn")
    )
    await db.execute(
        sql_update(Product)
        .where(Product.id == product_id)
        .values(
            is_listed_on_marketplace=False,
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()
    
    return {"message": "Listing withdrawn successfully"}
