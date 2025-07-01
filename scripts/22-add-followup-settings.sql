ALTER TABLE settings
ADD COLUMN followup_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN followup_delay_hours INTEGER DEFAULT 24;

-- Update existing rows to ensure default values are applied
UPDATE settings
SET
  followup_enabled = TRUE,
  followup_delay_hours = 24
WHERE
  followup_enabled IS NULL OR followup_delay_hours IS NULL;
