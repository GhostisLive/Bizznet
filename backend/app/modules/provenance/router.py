from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.auth.models import CurrentUser
from app.modules.provenance.models import ProvenanceRecordCreate, ProvenanceRecordRead
from app.modules.provenance import service

router = APIRouter(prefix="/provenance", tags=["ESG & Provenance"])


@router.post("/record/create", response_model=ProvenanceRecordRead)
async def create_provenance_record(
    data: ProvenanceRecordCreate,
    current_user: CurrentUser = Depends(
        require_role(["raw_material_supplier", "manufacturer"])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Generates an immutable provenance record indicating verification hierarchy."""
    record = await service.create_provenance_record(
        data, current_user.organization_id, db
    )
    return record


@router.post("/evidence/upload")
async def upload_evidence(
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Returns a pre-signed URL for uploading documentation to the
    Supabase Storage bucket vault. (Placeholder — needs Supabase Storage SDK.)
    """
    return {
        "message": "Evidence upload endpoint. Integrate with Supabase Storage for pre-signed URLs.",
        "organization_id": str(current_user.organization_id),
    }


@router.get("/records", response_model=List[ProvenanceRecordRead])
async def get_provenance_records(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves provenance records — auditors see all, others see only their own."""
    records = await service.get_records_by_org(
        current_user.organization_id,
        db,
        is_auditor=(current_user.role == "auditor"),
    )
    return records


@router.post("/{record_id}/audit", response_model=ProvenanceRecordRead)
async def audit_provenance_record(
    record_id: UUID,
    current_user: CurrentUser = Depends(require_role(["auditor"])),
    db: AsyncSession = Depends(get_db),
):
    """Enables auditors to certify environmental claims on a provenance record."""
    record = await service.audit_record(
        record_id, current_user.organization_id, db
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provenance record not found.",
        )
    return record
