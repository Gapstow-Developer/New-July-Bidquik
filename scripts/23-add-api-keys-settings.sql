ALTER TABLE settings
ADD COLUMN gmail_client_id TEXT,
ADD COLUMN gmail_client_secret TEXT,
ADD COLUMN gmail_refresh_token TEXT,
ADD COLUMN sendgrid_api_key TEXT,
ADD COLUMN google_client_id TEXT,
ADD COLUMN google_client_secret TEXT,
ADD COLUMN blob_read_write_token TEXT,
ADD COLUMN twilio_account_sid TEXT,
ADD COLUMN twilio_auth_token TEXT,
ADD COLUMN twilio_phone_number TEXT;

-- Set default values for existing rows if necessary, or handle nulls in application logic
-- For new columns, they will default to NULL.
