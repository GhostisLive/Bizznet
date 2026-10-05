-- Migration: Add read receipts, message editing, and reactions
-- Created: 2026-10-05

-- Add edited_at column to negotiation_messages
ALTER TABLE negotiation_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Message Read Receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES negotiation_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Message Reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES negotiation_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE message_read_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- Add comments for documentation
COMMENT ON TABLE message_read_receipts IS 'Tracks which users have read which messages';
COMMENT ON TABLE message_reactions IS 'Emoji reactions on messages';
COMMENT ON COLUMN message_reactions.emoji IS 'Emoji character (e.g., 👍, ❤️, 😂)';