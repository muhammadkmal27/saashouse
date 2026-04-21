-- system_settings: key-value store for admin-configurable settings
CREATE TABLE IF NOT EXISTS system_settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default values
INSERT INTO system_settings (key, value) VALUES
    ('admin_email',       '"akmallmuhammad27@gmail.com"'),
    ('maintenance_mode',  'false'),
    ('smtp_config',       '{"host":"smtp.gmail.com","port":465,"user":"","from":"no-reply@saashouse.com"}')
ON CONFLICT (key) DO NOTHING;
