-- Migration: Add service agreements table and provider name setting

-- 1. Create service_agreements table
CREATE TABLE IF NOT EXISTS service_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    deposit_amount DECIMAL(10, 2) NOT NULL,
    balance_amount DECIMAL(10, 2) NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signature_data TEXT, -- Can be a name or base64 signature
    UNIQUE(project_id)
);

-- 2. Add service_provider_name to system_settings if it doesn't exist
INSERT INTO system_settings (key, value, updated_at)
VALUES ('service_provider_name', '"SaaS House Development"', NOW())
ON CONFLICT (key) DO NOTHING;
