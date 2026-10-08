from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from datetime import datetime, timezone
import math

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


async def compute_confidence_score(organization_id: UUID, db: AsyncSession) -> float:
    """Compute a confidence score (0-1) for an organization based on its provenance records."""
    # Fetch all provenance records for the organization
    result = await db.execute(
        select(ProvenanceRecord).where(
            ProvenanceRecord.organization_id == organization_id
        )
    )
    records = list(result.scalars().all())

    if not records:
        return 0.0

    now = datetime.now(timezone.utc)
    total_score = 0.0

    for record in records:
        # Type score
        type_score_map = {
            "self_reported": 0.2,
            "audited": 0.5,
            "verified": 0.8
        }
        type_score = type_score_map.get(record.type, 0.2)

        # Recency factor
        if record.verified_at:
            days_since = (now - record.verified_at).days
            recency_factor = math.exp(-days_since / 365)
        else:
            recency_factor = 0.5

        # Completeness factor
        completeness_factor = 1.0 if (record.payload and isinstance(record.payload, dict) and record.payload) else 0.5

        # Evidence factor
        evidence_factor = 1.0 if record.evidence_url else 0.5

        # Expiration factor
        if record.expiration_date:
            expiration_factor = 1.0 if record.expiration_date > now else 0.5
        else:
            expiration_factor = 1.0

        # Calculate record score
        record_score = type_score * recency_factor * completeness_factor * evidence_factor * expiration_factor
        total_score += record_score

    # Average and clamp between 0 and 1
    average_score = total_score / len(records)
    return max(0.0, min(1.0, average_score))