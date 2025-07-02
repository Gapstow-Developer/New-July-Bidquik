-- This script migrates existing data to a default organization.
-- IMPORTANT: You must manually create the "Westlake Window Cleaners" organization in your Clerk dashboard
-- and get its ID (e.g., org_xxxxxxxxxxxx). Replace the placeholder below with the actual ID.

DO $$
DECLARE
    -- REPLACE THIS with the actual Clerk Organization ID for "Westlake Window Cleaners"
    westlake_org_id TEXT := 'org_2iLh8a7sDb9bJk6fG5H4E3C2B1A';
BEGIN
    -- Migrate settings
    UPDATE settings
    SET organization_id = westlake_org_id
    WHERE organization_id IS NULL;

    -- Migrate services
    UPDATE services
    SET organization_id = westlake_org_id
    WHERE organization_id IS NULL;

    -- Migrate quotes
    UPDATE quotes
    SET organization_id = westlake_org_id
    WHERE organization_id IS NULL;

    -- Migrate calculator_starts
    UPDATE calculator_starts
    SET organization_id = westlake_org_id
    WHERE organization_id IS NULL;
END $$;
