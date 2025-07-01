ALTER TABLE settings
ADD COLUMN pressure_washing_enabled BOOLEAN DEFAULT FALSE;

-- Optional: If you want to set it to TRUE for existing rows, or ensure it's FALSE
UPDATE settings
SET pressure_washing_enabled = FALSE
WHERE pressure_washing_enabled IS NULL;
