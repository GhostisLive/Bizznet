from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.auth.models import CurrentUser
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.modules.auditor import service
from app.modules.auditor.models import (
    AuditRequestCreate,
    CompanyAuditRequestCreate,
    AuditorRead,
    AuditRequestRead,
    AuditRequestUpdate,
    AuditCompletionCreate,
    AuditCompletionRead,
    AuditLogRead,
    AuditorCompanyRead,
    AuditorMessageCreate,
    AuditorMessageRead,
    CertificationCreate,
    CertificationRead,
)

router = APIRouter(prefix="/auditor", tags=["Auditor Workspace"])
auditor_user = require_role(["auditor"])


@router.get("/companies", response_model=list[AuditorCompanyRead])
async def companies(current_user: CurrentUser = Depends(auditor_user), db: AsyncSession = Depends(get_db)):
    return await service.list_companies(current_user.organization_id, db)


@router.get("/auditors", response_model=list[AuditorRead])
async def auditors(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists available auditors for companies requesting an audit."""
    if current_user.role in {"auditor", "admin"}:
        raise HTTPException(status_code=403, detail="Only companies can request an audit")
    return await service.list_auditors(db)


@router.post("/company-requests", response_model=AuditRequestRead)
async def company_request_audit(
    data: CompanyAuditRequestCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates an audit request from a company to a selected auditor."""
    if current_user.role in {"auditor", "admin"}:
        raise HTTPException(status_code=403, detail="Only companies can request an audit")
    try:
        request = await service.create_company_audit_request(
            current_user.organization_id, data, db
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    company = await service.get_company(request.company_id, db)
    return AuditRequestRead(**request.model_dump(), company=service._company(company))


@router.get("/company-requests", response_model=list[AuditRequestRead])
async def company_audit_requests(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role in {"auditor", "admin"}:
        raise HTTPException(status_code=403, detail="Only companies can view company audit requests")
    return [
        AuditRequestRead(**request.model_dump(), company=service._company(company))
        for request, company in await service.list_company_audit_requests(
            current_user.organization_id, db
        )
    ]


@router.get("/overview")
async def auditor_overview(current_user: CurrentUser = Depends(auditor_user), db: AsyncSession = Depends(get_db)):
    return await service.overview(current_user.organization_id, db)


@router.get("/conversations/{company_id}/messages", response_model=list[AuditorMessageRead])
async def conversation_messages(
    company_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company = await service.get_company(company_id, db)
    if not company:
        raise HTTPException(status_code=404, detail="Registered company not found")
    if current_user.role == "auditor":
        conversation = await service.get_or_create_conversation(current_user.organization_id, company_id, db)
    else:
        conversation = await service.get_conversation_for_participant(current_user.organization_id, company_id, db)
        if not conversation:
            raise HTTPException(status_code=404, detail="No auditor conversation exists for this company")
    return await service.list_messages(conversation.id, db)


@router.post("/conversations/{company_id}/messages", response_model=AuditorMessageRead)
async def send_message(
    company_id: UUID,
    data: AuditorMessageCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company = await service.get_company(company_id, db)
    if not company or (current_user.role != "auditor" and current_user.organization_id != company_id):
        raise HTTPException(status_code=404, detail="Registered company not found")
    if current_user.role == "auditor":
        conversation = await service.get_or_create_conversation(current_user.organization_id, company_id, db)
    else:
        conversation = await service.get_conversation_for_participant(current_user.organization_id, company_id, db)
        if not conversation:
            raise HTTPException(status_code=404, detail="No auditor conversation exists for this company")
    return await service.create_message(conversation.id, current_user.organization_id, data, db)


@router.post("/audit-requests", response_model=AuditRequestRead)
async def request_audit(
    data: AuditRequestCreate,
    current_user: CurrentUser = Depends(auditor_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        request = await service.create_audit_request(current_user.organization_id, data, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    company = await service.get_company(request.company_id, db)
    return AuditRequestRead(**request.model_dump(), company=service._company(company))


@router.get("/audit-requests", response_model=list[AuditRequestRead])
async def audit_requests(current_user: CurrentUser = Depends(auditor_user), db: AsyncSession = Depends(get_db)):
    return [
        AuditRequestRead(**request.model_dump(), company=service._company(company))
        for request, company in await service.list_audit_requests(current_user.organization_id, db)
    ]


@router.patch("/audit-requests/{request_id}", response_model=AuditRequestRead)
async def update_audit_request(
    request_id: UUID,
    data: AuditRequestUpdate,
    current_user: CurrentUser = Depends(auditor_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        request = await service.update_audit_request(
            current_user.organization_id, request_id, data, db
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    company = await service.get_company(request.company_id, db)
    return AuditRequestRead(**request.model_dump(), company=service._company(company))


@router.post("/audit-requests/{request_id}/complete", response_model=AuditCompletionRead)
async def complete_audit(
    request_id: UUID,
    data: AuditCompletionCreate,
    current_user: CurrentUser = Depends(auditor_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        audit_log, certificate = await service.complete_audit(
            current_user.organization_id, request_id, data, db
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    company = await service.get_company(certificate.company_id, db)
    company_read = service._company(company)
    return AuditCompletionRead(
        audit_log=AuditLogRead(
            **audit_log.model_dump(), company=company_read
        ),
        certification=CertificationRead(
            **certificate.model_dump(), company=company_read
        ),
    )


@router.get("/audit-logs", response_model=list[AuditLogRead])
async def audit_logs(current_user: CurrentUser = Depends(auditor_user), db: AsyncSession = Depends(get_db)):
    return [
        AuditLogRead(**log.model_dump(), company=service._company(company))
        for log, company in await service.list_audit_logs(current_user.organization_id, db)
    ]


@router.get("/certifications", response_model=list[CertificationRead])
async def certifications(current_user: CurrentUser = Depends(auditor_user), db: AsyncSession = Depends(get_db)):
    return [
        CertificationRead(**certificate.model_dump(), company=service._company(company))
        for certificate, company in await service.list_certifications(current_user.organization_id, db)
    ]


@router.get("/company-certifications", response_model=list[CertificationRead])
async def company_certifications(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role in {"auditor", "admin"}:
        raise HTTPException(status_code=403, detail="Only companies can view company certifications")
    return [
        CertificationRead(**certificate.model_dump(), company=service._company(company))
        for certificate, company in await service.list_company_certifications(
            current_user.organization_id, db
        )
    ]


@router.post("/certifications", response_model=CertificationRead)
async def issue_certification(
    data: CertificationCreate,
    current_user: CurrentUser = Depends(auditor_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        certificate = await service.create_certification(current_user.organization_id, data, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    company = await service.get_company(certificate.company_id, db)
    return CertificationRead(**certificate.model_dump(), company=service._company(company))
