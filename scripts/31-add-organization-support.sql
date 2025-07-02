-- Add organization_id to settings table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='organization_id') THEN
        ALTER TABLE settings ADD COLUMN organization_id TEXT;
    END IF;
END $$;

-- Add organization_id to services table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='organization_id') THEN
        ALTER TABLE services ADD COLUMN organization_id TEXT;
    END IF;
END $$;

-- Add organization_id to quotes table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='organization_id') THEN
        ALTER TABLE quotes ADD COLUMN organization_id TEXT;
    END IF;
END $$;

-- Add organization_id to calculator_starts table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='calculator_starts' AND column_name='organization_id') THEN
        ALTER TABLE calculator_starts ADD COLUMN organization_id TEXT;
    END IF;
END $$;

-- Add organization_id to email_templates table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='organization_id') THEN
        ALTER TABLE email_templates ADD COLUMN organization_id TEXT;
    END IF;
END $$;
