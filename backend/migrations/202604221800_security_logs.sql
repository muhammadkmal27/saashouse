-- Rule 24: Security Event Logging
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- e.g., 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'UNAUTHORIZED_ACCESS'
    user_id UUID, -- Optional, if logged in
    email TEXT, -- For failed logins
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
