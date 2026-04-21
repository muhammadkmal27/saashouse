-- Add JSONB and WhatsApp Number requirements to projects table
ALTER TABLE projects ADD COLUMN requirements JSONB;
ALTER TABLE projects ADD COLUMN whatsapp_number VARCHAR(20) DEFAULT '' NOT NULL;
