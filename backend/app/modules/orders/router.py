from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.modules.orders.models import (
    OrderCreate,
    OrderRead,
    OrderStatusUpdate,
    OrderDocumentCreate,
    OrderDocumentRead,
)
from app.modules.orders import service
from app.modules.negotiation import service as negotiation_service
from app.modules.rfq import service as rfq_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderRead)
async def create_order(
    data: OrderCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates an order from a locked negotiation or awarded RFQ bid.
    Must provide either negotiation_id or rfq_bid_id.
    """
    if not data.negotiation_id and not data.rfq_bid_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide either negotiation_id or rfq_bid_id.",
        )
    
    if data.negotiation_id and data.rfq_bid_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot provide both negotiation_id and rfq_bid_id.",
        )
    
    buyer_id = None
    seller_id = None
    provenance_data = None
    
    # Get parties from negotiation
    if data.negotiation_id:
        negotiation = await negotiation_service.get_negotiation_detail(
            data.negotiation_id, db
        )
        if not negotiation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Negotiation not found.",
            )
        
        if negotiation.status != "terms_locked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only create order from locked negotiations.",
            )
        
        buyer_id = negotiation.buyer_id
        seller_id = negotiation.seller_id
    
    # Get parties from RFQ bid
    elif data.rfq_bid_id:
        # Get the bid
        bids = await rfq_service.list_rfq_bids(UUID("00000000-0000-0000-0000-000000000000"), db)
        bid = next((b for b in bids if str(b.id) == str(data.rfq_bid_id)), None)
        
        if not bid:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="RFQ bid not found.",
            )
        
        if bid.status != "awarded":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only create order from awarded bids.",
            )
        
        # Get RFQ to find buyer
        rfq = await rfq_service.get_rfq_detail(bid.rfq_id, db)
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="RFQ not found.",
            )
        
        buyer_id = rfq.buyer_id
        seller_id = bid.supplier_id
    
    # Verify current user is buyer or seller
    if current_user.organization_id not in [buyer_id, seller_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a party to this transaction.",
        )
    
    order = await service.create_order(data, buyer_id, seller_id, db, provenance_data)
    return order


@router.get("", response_model=List[OrderRead])
async def list_orders(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    as_buyer: bool = Query(default=False),
    as_seller: bool = Query(default=False),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists orders for the current organization.
    Can filter by role (buyer/seller) and status.
    """
    orders = await service.list_orders(
        db,
        organization_id=current_user.organization_id,
        status=status_filter,
        as_buyer=as_buyer,
        as_seller=as_seller,
    )
    return orders


@router.get("/statistics")
async def get_order_statistics(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gets order statistics for the current organization."""
    stats = await service.get_order_statistics(current_user.organization_id, db)
    return stats


@router.get("/{order_id}", response_model=OrderRead)
async def get_order_detail(
    order_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gets detailed information about an order."""
    order = await service.get_order_detail(order_id, db)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )
    
    # Verify current user is buyer or seller
    if current_user.organization_id not in [order.buyer_id, order.seller_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a party to this order.",
        )
    
    return order


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: UUID,
    data: OrderStatusUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates order status.
    Status flow: confirmed → in_production → ready_to_ship → in_transit → delivered → completed
    """
    order = await service.get_order_detail(order_id, db)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )
    
    # Verify current user is buyer or seller
    if current_user.organization_id not in [order.buyer_id, order.seller_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a party to this order.",
        )
    
    # Validate status transitions
    valid_statuses = [
        "confirmed",
        "in_production",
        "ready_to_ship",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
    ]
    
    if data.new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )
    
    updated_order = await service.update_order_status(
        order_id,
        data,
        current_user.organization_id,
        db,
    )
    
    return updated_order


@router.get("/{order_id}/history")
async def get_order_history(
    order_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gets status change history for an order."""
    order = await service.get_order_detail(order_id, db)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )
    
    # Verify current user is buyer or seller
    if current_user.organization_id not in [order.buyer_id, order.seller_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a party to this order.",
        )
    
    history = await service.get_order_history(order_id, db)
    return history


@router.post("/{order_id}/documents", response_model=OrderDocumentRead)
async def add_order_document(
    order_id: UUID,
    data: OrderDocumentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Adds a document to an order (invoice, shipping label, etc.).
    """
    order = await service.get_order_detail(order_id, db)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )
    
    # Verify current user is buyer or seller
    if current_user.organization_id not in [order.buyer_id, order.seller_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a party to this order.",
        )
    
    document = await service.add_order_document(
        order_id,
        data,
        current_user.organization_id,
        db,
    )
    return document


@router.get("/{order_id}/documents", response_model=List[OrderDocumentRead])
async def list_order_documents(
    order_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all documents for an order."""
    order = await service.get_order_detail(order_id, db)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )
    
    # Verify current user is buyer or seller
    if current_user.organization_id not in [order.buyer_id, order.seller_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a party to this order.",
        )
    
    documents = await service.list_order_documents(order_id, db)
    return documents
