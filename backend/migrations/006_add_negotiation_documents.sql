ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS accepted_price DOUBLE PRECISION;
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS accepted_moq DOUBLE PRECISION;
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES organizations(id);
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS negotiation_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
    document_type VARCHAR(80) NOT NULL DEFAULT 'commercial_agreement',
    document_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_markdown TEXT NOT NULL,
    terms_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    generation_source VARCHAR(30) NOT NULL,
    ai_model VARCHAR(100),
    generation_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_documents_negotiation_id
    ON negotiation_documents(negotiation_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_negotiation_documents_number
    ON negotiation_documents(document_number);
