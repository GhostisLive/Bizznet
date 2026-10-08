-- Auditor workspace: company conversations, audit requests, audit history and certificates.
CREATE TABLE IF NOT EXISTS auditor_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(auditor_id, company_id)
);

CREATE TABLE IF NOT EXISTS auditor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES auditor_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    audit_type VARCHAR(30) NOT NULL CHECK (audit_type IN ('company', 'labour', 'carbon')),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    scope_note TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES audit_requests(id) ON DELETE SET NULL,
    auditor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    audit_type VARCHAR(30) NOT NULL CHECK (audit_type IN ('company', 'labour', 'carbon')),
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    findings TEXT,
    recommendations TEXT,
    completed_at TIMESTAMPTZ,
    digital_contract_id VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditor_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    audit_type VARCHAR(30) NOT NULL CHECK (audit_type IN ('company', 'labour', 'carbon')),
    certificate_number VARCHAR(100) NOT NULL UNIQUE,
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_auditor_messages_conversation ON auditor_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_requests_auditor ON audit_requests(auditor_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_auditor ON audit_logs(auditor_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_certifications_auditor ON certifications(auditor_id, issued_at DESC);
