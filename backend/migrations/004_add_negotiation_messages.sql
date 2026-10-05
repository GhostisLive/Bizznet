-- Migration: Add negotiation_messages table
-- Created: 2026-10-05

-- Negotiation Messages table for chat within negotiations
CREATE TABLE IF NOT EXISTS negotiation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_negotiation_id ON negotiation_messages(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_sender_id ON negotiation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_created_at ON negotiation_messages(created_at ASC);

-- Enable realtime for negotiation_messages
ALTER PUBLICATION supabase_realtime ADD TABLE negotiation_messages;

-- Add comments for documentation
COMMENT ON TABLE negotiation_messages IS 'Chat messages within negotiation threads';
COMMENT ON COLUMN negotiation_messages.content IS 'Message content';
COMMENT ON COLUMN negotiation_messages.sender_id IS 'Organization that sent the message';