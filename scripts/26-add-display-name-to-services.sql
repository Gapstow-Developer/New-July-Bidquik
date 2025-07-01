ALTER TABLE services
ADD COLUMN display_name TEXT;

-- Optional: Populate existing services with their 'name' as 'display_name' if it's currently NULL
UPDATE services
SET display_name = name
WHERE display_name IS NULL;
