-- Add client_edit_allowed column to projects table
ALTER TABLE projects ADD COLUMN client_edit_allowed BOOLEAN DEFAULT FALSE;
