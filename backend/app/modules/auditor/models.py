from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class AuditorConversation(SQLModel, table=True):
    __tablename__ = "auditor_conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    auditor_id: UUID = Field(foreign_key="organizations.id", index=True)
    company_id: UUID = Field(foreign_key="organizations.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditorMessage(SQLModel, table=True):
    __tablename__ = "auditor_messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="auditor_conversations.id", index=True)
    sender_id: UUID = Field(foreign_key="organizations.id", index=True)
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditRequest(SQLModel, table=True):
    __tablename__ = "audit_requests"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    auditor_id: UUID = Field(foreign_key="organizations.id", index=True)
    company_id: UUID = Field(foreign_key="organizations.id", index=True)
    audit_type: str = Field(max_length=30)
    status: str = Field(default="pending", max_length=30, index=True)
    scope_note: Optional[str] = None
    requested_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    due_at: Optional[datetime] = None


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    request_id: Optional[UUID] = Field(default=None, foreign_key="audit_requests.id", index=True)
    auditor_id: UUID = Field(foreign_key="organizations.id", index=True)
    company_id: UUID = Field(foreign_key="organizations.id", index=True)
    audit_type: str = Field(max_length=30)
    score: Optional[int] = Field(default=None, ge=0, le=100)
    findings: Optional[str] = None
    recommendations: Optional[str] = None
    completed_at: Optional[datetime] = None
    digital_contract_id: Optional[str] = Field(default=None, max_length=100)


class Certification(SQLModel, table=True):
    __tablename__ = "certifications"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    auditor_id: UUID = Field(foreign_key="organizations.id", index=True)
    company_id: UUID = Field(foreign_key="organizations.id", index=True)
    audit_type: str = Field(max_length=30)
    certificate_number: str = Field(max_length=100, unique=True)
    score: Optional[int] = Field(default=None, ge=0, le=100)
    issued_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    status: str = Field(default="active", max_length=30, index=True)


class AuditorCompanyRead(SQLModel):
    id: UUID
    name: str
    role: str
    status: str


class AuditorMessageCreate(SQLModel):
    content: str = Field(min_length=1, max_length=10000)


class AuditorMessageRead(SQLModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    created_at: datetime


class AuditorConversationRead(SQLModel):
    id: UUID
    company: AuditorCompanyRead
    last_message: Optional[AuditorMessageRead] = None


class AuditRequestCreate(SQLModel):
    company_id: UUID
    audit_type: Literal["company", "labour", "carbon"]
    scope_note: Optional[str] = Field(default=None, max_length=5000)
    due_at: Optional[datetime] = None


class CompanyAuditRequestCreate(SQLModel):
    auditor_id: UUID
    audit_type: Literal["company", "labour", "carbon"] = "company"
    scope_note: Optional[str] = Field(default=None, max_length=5000)
    due_at: Optional[datetime] = None


class AuditorRead(SQLModel):
    id: UUID
    name: str
    role: str
    status: str


class AuditRequestRead(SQLModel):
    id: UUID
    auditor_id: UUID
    company_id: UUID
    company: AuditorCompanyRead
    audit_type: str
    status: str
    scope_note: Optional[str]
    requested_at: datetime
    due_at: Optional[datetime]


class AuditLogRead(SQLModel):
    id: UUID
    request_id: Optional[UUID]
    company_id: UUID
    company: AuditorCompanyRead
    audit_type: str
    score: Optional[int]
    findings: Optional[str]
    recommendations: Optional[str]
    completed_at: Optional[datetime]
    digital_contract_id: Optional[str]


class CertificationCreate(SQLModel):
    company_id: UUID
    audit_type: Literal["company", "labour", "carbon"]
    score: Optional[int] = Field(default=None, ge=0, le=100)
    expires_at: Optional[datetime] = None


class CertificationRead(SQLModel):
    id: UUID
    auditor_id: UUID
    company_id: UUID
    company: AuditorCompanyRead
    audit_type: str
    certificate_number: str
    score: Optional[int]
    issued_at: datetime
    expires_at: Optional[datetime]
    status: str
