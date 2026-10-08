from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.modules.auditor.models import (
    AuditLog,
    AuditRequest,
    AuditRequestCreate,
    AuditorCompanyRead,
    AuditorConversation,
    AuditorMessage,
    AuditorMessageCreate,
    Certification,
    CertificationCreate,
)
from app.modules.network.models import Organization


def _company(org: Organization) -> AuditorCompanyRead:
    return AuditorCompanyRead(id=org.id, name=org.name, role=org.role, status=org.status)


async def list_companies(auditor_id: UUID, db: AsyncSession) -> list[AuditorCompanyRead]:
    result = await db.execute(
        select(Organization)
        .where(
            Organization.id != auditor_id,
            Organization.role.notin_(["auditor", "admin"]),
            Organization.status != "suspended",
        )
        .order_by(Organization.name)
    )
    return [_company(item) for item in result.scalars().all()]


async def get_company(company_id: UUID, db: AsyncSession) -> Organization | None:
    result = await db.execute(select(Organization).where(Organization.id == company_id))
    return result.scalar_one_or_none()


async def get_or_create_conversation(auditor_id: UUID, company_id: UUID, db: AsyncSession) -> AuditorConversation:
    result = await db.execute(
        select(AuditorConversation).where(
            AuditorConversation.auditor_id == auditor_id,
            AuditorConversation.company_id == company_id,
        )
    )
    conversation = result.scalar_one_or_none()
    if conversation:
        return conversation
    conversation = AuditorConversation(auditor_id=auditor_id, company_id=company_id)
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def get_conversation_for_participant(
    participant_id: UUID, company_id: UUID, db: AsyncSession
) -> AuditorConversation | None:
    result = await db.execute(
        select(AuditorConversation).where(
            AuditorConversation.company_id == company_id,
            (AuditorConversation.auditor_id == participant_id)
            | (AuditorConversation.company_id == participant_id),
        )
    )
    return result.scalar_one_or_none()


async def overview(auditor_id: UUID, db: AsyncSession) -> dict[str, int | float | None]:
    pending = await db.scalar(
        select(func.count(AuditRequest.id)).where(
            AuditRequest.auditor_id == auditor_id,
            AuditRequest.status.in_(["pending", "in_progress"]),
        )
    )
    completed = await db.scalar(
        select(func.count(AuditLog.id)).where(
            AuditLog.auditor_id == auditor_id,
            AuditLog.completed_at.is_not(None),
        )
    )
    certificates = await db.scalar(
        select(func.count(Certification.id)).where(
            Certification.auditor_id == auditor_id,
            Certification.status == "active",
        )
    )
    average = await db.scalar(
        select(func.avg(AuditLog.score)).where(
            AuditLog.auditor_id == auditor_id,
            AuditLog.score.is_not(None),
        )
    )
    return {
        "open_requests": pending or 0,
        "completed_audits": completed or 0,
        "active_certifications": certificates or 0,
        "average_score": round(float(average), 1) if average is not None else None,
    }


async def list_messages(conversation_id: UUID, db: AsyncSession) -> list[AuditorMessage]:
    result = await db.execute(
        select(AuditorMessage)
        .where(AuditorMessage.conversation_id == conversation_id)
        .order_by(AuditorMessage.created_at)
    )
    return list(result.scalars().all())


async def create_message(
    conversation_id: UUID,
    sender_id: UUID,
    data: AuditorMessageCreate,
    db: AsyncSession,
) -> AuditorMessage:
    message = AuditorMessage(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=data.content.strip(),
    )
    db.add(message)
    conversation = await db.get(AuditorConversation, conversation_id)
    if conversation:
        conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(message)
    return message


async def create_audit_request(
    auditor_id: UUID,
    data: AuditRequestCreate,
    db: AsyncSession,
) -> AuditRequest:
    company = await get_company(data.company_id, db)
    if not company or company.role in {"auditor", "admin"} or company.status == "suspended":
        raise ValueError("Registered company not found")
    request = AuditRequest(auditor_id=auditor_id, **data.model_dump())
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request


async def list_audit_requests(auditor_id: UUID, db: AsyncSession) -> list[tuple[AuditRequest, Organization]]:
    result = await db.execute(
        select(AuditRequest, Organization)
        .join(Organization, Organization.id == AuditRequest.company_id)
        .where(AuditRequest.auditor_id == auditor_id)
        .order_by(AuditRequest.requested_at.desc())
    )
    return list(result.all())


async def list_audit_logs(auditor_id: UUID, db: AsyncSession) -> list[tuple[AuditLog, Organization]]:
    result = await db.execute(
        select(AuditLog, Organization)
        .join(Organization, Organization.id == AuditLog.company_id)
        .where(AuditLog.auditor_id == auditor_id)
        .order_by(AuditLog.completed_at.desc().nullslast())
    )
    return list(result.all())


async def list_certifications(auditor_id: UUID, db: AsyncSession) -> list[tuple[Certification, Organization]]:
    result = await db.execute(
        select(Certification, Organization)
        .join(Organization, Organization.id == Certification.company_id)
        .where(Certification.auditor_id == auditor_id)
        .order_by(Certification.issued_at.desc())
    )
    return list(result.all())


async def create_certification(
    auditor_id: UUID,
    data: CertificationCreate,
    db: AsyncSession,
) -> Certification:
    company = await get_company(data.company_id, db)
    if not company or company.role in {"auditor", "admin"} or company.status == "suspended":
        raise ValueError("Registered company not found")
    sequence = await db.scalar(
        select(func.count(Certification.id)).where(Certification.auditor_id == auditor_id)
    )
    number = f"CERT-{datetime.now(timezone.utc).year}-{(sequence or 0) + 1:04d}"
    certificate = Certification(
        auditor_id=auditor_id,
        certificate_number=number,
        **data.model_dump(),
    )
    db.add(certificate)
    await db.commit()
    await db.refresh(certificate)
    return certificate
