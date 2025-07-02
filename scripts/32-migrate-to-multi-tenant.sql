DO $$
DECLARE
    westlake_org_id TEXT := 'org_2zJuVEACIi8J8OBx7ZBjHrE584Q';
BEGIN
    -- Update settings table
    UPDATE settings
    SET organization_id = westlake_org_id
    WHERE organization_id IS NULL;

    -- Update services table
    UPDATE services
    SET organization_id = westlake_org_id
    WHERE organization_id IS NULL;

    -- Update quotes table
    UPDATE quotes
    SET organization_id = westlake_org_id
    WHERE organization_id IS NULL;

    -- Update calculator_starts table
    UPDATE calculator_starts
    SET organization_id = westlake_org_id
    WHERE organization_id IS NULL;

    -- Update email_templates table
    UPDATE email_templates
    SET organization_id = westlake_org_id
    WHERE organization_id IS NULL;

    -- Note: Users table is managed by Clerk, so we don't update it directly here.
    -- User-to-organization mapping is handled by Clerk's API.
END $$;
