-- First, let's check if the email_templates table exists. If not, create it.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        CREATE TABLE email_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            template_name TEXT NOT NULL UNIQUE,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Now, let's ensure the default email templates are present.
-- We'll use ON CONFLICT DO UPDATE to handle cases where they might already exist
-- or if the script is run multiple times.

-- Business Email Template
INSERT INTO email_templates (template_name, subject, body)
VALUES (
    'business_quote_notification',
    'NEW WINDOW CLEANING QUOTE REQUEST',
    'NEW WINDOW CLEANING QUOTE REQUEST

QUOTE AMOUNT: ${{finalPrice}}

CUSTOMER INFORMATION:
- Name: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Address: {{address}}

PROPERTY DETAILS:
- Square Footage: {{squareFootage}} sq ft
- Number of Stories: {{stories}}
- Service Type: {{serviceType}}

SERVICES REQUESTED:
{{services}}

FINAL QUOTE: ${{finalPrice}}

Generated: {{timestamp}}

---
This quote was generated automatically by your window cleaning calculator.
Please contact the customer within 24 hours to schedule their service.'
)
ON CONFLICT (template_name) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Customer Email Template
INSERT INTO email_templates (template_name, subject, body)
VALUES (
    'customer_quote_confirmation',
    'Your Window Cleaning Quote from {{businessName}}',
    'Dear {{customerName}},

Thank you for requesting a quote from {{businessName}}!

YOUR QUOTE DETAILS:
Property Address: {{address}}
Square Footage: {{squareFootage}} sq ft
Number of Stories: {{stories}}
Service Type: {{serviceType}}

Services Requested:
{{services}}

TOTAL QUOTE: ${{finalPrice}}

We will contact you within 24 hours to schedule your service.

Best regards,
{{businessName}}

---
Quote generated on {{timestamp}}'
)
ON CONFLICT (template_name) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    updated_at = NOW();

-- Follow-up Email Template (from script 20)
INSERT INTO email_templates (template_name, subject, body)
VALUES (
    'followup_email',
    'Following Up On Your Quote from {{businessName}}',
    'Dear {{customerName}},

We hope this email finds you well.

We are following up on the quote we provided for your property at {{address}}. We wanted to ensure you received it and to see if you have any questions or would like to proceed with scheduling your service.

Your previous quote details:
Property Address: {{address}}
Square Footage: {{squareFootage}} sq ft
Number of Stories: {{stories}}
Service Type: {{serviceType}}
Services Requested:
{{services}}
TOTAL QUOTE: ${{finalPrice}}

Please feel free to reply to this email or call us at {{businessPhone}} to discuss your quote or schedule an appointment.

We look forward to hearing from you!

Best regards,
{{businessName}}

---
Quote generated on {{timestamp}}'
)
ON CONFLICT (template_name) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    updated_at = NOW();
