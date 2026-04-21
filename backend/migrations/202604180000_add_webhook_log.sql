-- Add processed_webhooks table for idempotency (Rule 11)
CREATE TABLE IF NOT EXISTS processed_webhooks (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup (older events)
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_at ON processed_webhooks(processed_at);
