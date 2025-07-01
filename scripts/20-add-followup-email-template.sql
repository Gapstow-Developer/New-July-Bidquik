-- Add followup_email_template column to settings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='followup_email_template') THEN
        ALTER TABLE settings ADD COLUMN followup_email_template TEXT;
    END IF;
END $$;

-- Update existing settings record with a default template if the column is null or empty
DO $$
DECLARE
    settings_id UUID;
BEGIN
    -- Try to get the first settings record ID
    SELECT id INTO settings_id FROM settings LIMIT 1;

    IF settings_id IS NOT NULL THEN
        -- Update existing record
        UPDATE settings
        SET
            followup_email_template = COALESCE(
                NULLIF(followup_email_template, ''),
                'Hi {{customerName}},

I noticed you started getting a quote for window cleaning services but didn''t complete the process. I''d love to help you get the best service possible!

{{#if finalPrice}}
Your Quote Summary:
Service: {{serviceType}}
Address: {{address}}
{{#if squareFootage}}Square Footage: {{squareFootage}} sq ft{{/if}}
Estimated Price: ${{finalPrice}}
{{/if}}

Why Choose {{businessName}}?
- ✅ Fully insured and bonded
- ✅ 100% satisfaction guarantee
- ✅ Competitive pricing with no hidden fees
- ✅ Professional, reliable service
- ✅ Free estimates

🎉 Special Offer Just for You!
Get 10% off your first service when you book within the next 48 hours!

Ready to get started?
Reply to this email or call us at {{businessPhone}}
We''re here to answer any questions and earn your business!

Best regards,
{{businessName}}
{{businessPhone}} | {{businessEmail}}'
            )
        WHERE id = settings_id;
    ELSE
        -- If no settings record exists, this will be handled by the /api/settings GET route
        -- which creates a default record including this template.
        RAISE NOTICE 'No settings record found. Default settings will be created on first access.';
    END IF;
END $$;
