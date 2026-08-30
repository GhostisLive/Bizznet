from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.auth.models import CurrentUser
from app.modules.provenance.models import ProvenanceRecord
from typing import List

router = APIRouter(prefix="/provenance", tags=["ESG & Materials Provenance"])

@router.post("/batch", response_model=ProvenanceRecord)
async def create_provenance_batch(
    material_name: str,
    quantity: float,
    unit: str,
    carbon_footprint: float,
    esg_flags: dict | None = None,
    origin_facility_id: str | None = None,
    current_user: CurrentUser = Depends(require_role(["supplier", "manufacturer"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new upstream raw material/component lot, complete
    with ESG declarations and carbon print indexes.
    """
    record = ProvenanceRecord(
        material_name=material_name,
        quantity=quantity,
        unit=unit,
        carbon_footprint_total=carbon_footprint,
        esg_criteria_flags=esg_flags,
        producer_id=current_user.organization_id,
        origin_facility_id=origin_facility_id,
        status="certified" if current_user.role == "manufacturer" else "draft"
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record

@router.get("/batches", response_model=List[ProvenanceRecord])
async def get_my_batches(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all localized material provenance declarations."""
    # Auditors see everything
    if current_user.role == "auditor":
        query = select(ProvenanceRecord)
    else:
        query = select(ProvenanceRecord).where(ProvenanceRecord.producer_id == current_user.organization_id)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/{record_id}/audit", response_model=ProvenanceRecord)
async def request_batch_audit(
    record_id: str,
    comments: str,
    current_user: CurrentUser = Depends(require_role(["auditor"])),
    db: AsyncSession = Depends(get_db)
):
    """Enables auditors to certify or issue queries regarding environmental claims."""
    # Fetch record
    query = select(ProvenanceRecord).where(ProvenanceRecord.id == record_id)
    result = await db.execute(query)
    record = result.scalar_one_or_none()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material provenance record not found."
        )
        
    # Auditor signs and updates status to certified
    record.status = "certified"
    # Append comment to esg flags
    if not record.esg_criteria_flags:
        record.esg_criteria_flags = {}
    record.esg_criteria_flags["audited_by"] = str(current_user.organization_id)
    record.esg_criteria_flags["auditor_comments"] = comments
    
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record
