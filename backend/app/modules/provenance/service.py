from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from datetime import datetime, timezone

from app.modules.provenance.models import ProvenanceRecord, ProvenanceRecordCreate


async def create_provenance_record(
    data: ProvenanceRecordCreate,
    organization_id: UUID,
    db: AsyncSession,
) -> ProvenanceRecord:
    """Creates an immutable provenance record for an organization."""
    record = ProvenanceRecord(
        organization_id=organization_id,
        type=data.type,
        verifying_party=data.verifying_party,
        evidence_url=data.evidence_url,
        payload=data.payload,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def get_records_by_org(
    organization_id: UUID,
    db: AsyncSession,
    is_auditor: bool = False,
) -> list[ProvenanceRecord]:
    """Returns provenance records — auditors see all, others see only their own."""
    if is_auditor:
        query = select(ProvenanceRecord)
    else:
        query = select(ProvenanceRecord).where(
            ProvenanceRecord.organization_id == organization_id
        )

    result = await db.execute(query)
    return list(result.scalars().all())


async def audit_record(
    record_id: UUID,
    auditor_org_id: UUID,
    db: AsyncSession,
) -> ProvenanceRecord | None:
    """Marks a provenance record as audited by a third-party auditor."""
    result = await db.execute(
        select(ProvenanceRecord).where(ProvenanceRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        return None

    record.type = "audited"
    record.verifying_party = str(auditor_org_id)
    record.verified_at = datetime.now(timezone.utc)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record
