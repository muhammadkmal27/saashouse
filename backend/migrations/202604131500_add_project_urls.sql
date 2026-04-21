-- Add dev_url and prod_url to projects table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='dev_url') THEN
        ALTER TABLE projects ADD COLUMN dev_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='prod_url') THEN
        ALTER TABLE projects ADD COLUMN prod_url TEXT;
    END IF;
END $$;
