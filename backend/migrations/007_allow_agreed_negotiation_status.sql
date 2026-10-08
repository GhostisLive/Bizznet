ALTER TABLE negotiations DROP CONSTRAINT IF EXISTS negotiations_status_check;
ALTER TABLE negotiations
    ADD CONSTRAINT negotiations_status_check
    CHECK (status IN ('active', 'countered', 'agreed', 'terms_locked', 'contract_signed', 'completed', 'cancelled'));
