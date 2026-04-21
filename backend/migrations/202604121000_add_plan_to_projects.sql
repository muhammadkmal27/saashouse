-- Add selected_plan to projects table to track the onboarding intent
ALTER TABLE projects ADD COLUMN selected_plan VARCHAR(100);
