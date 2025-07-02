-- Add organization_id to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization_id to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization_id to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_settings_organization_id ON settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_organization_id ON quotes(organization_id);

-- Note: We are not using RLS policies at this stage to keep the initial setup simpler.
-- Data isolation will be handled at the application layer.
