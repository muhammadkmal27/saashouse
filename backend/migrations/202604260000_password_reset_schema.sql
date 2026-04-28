-- Migration: Add password reset tokens table
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookup of active tokens per user
CREATE INDEX IF NOT EXISTS idx_password_resets_user_active ON password_resets(user_id) WHERE is_used = false;
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
