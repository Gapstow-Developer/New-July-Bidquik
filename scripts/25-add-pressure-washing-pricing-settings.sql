ALTER TABLE settings
ADD COLUMN pressure_washing_per_sqft_price NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN pressure_washing_flat_fee NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN pressure_washing_minimum_price NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN pressure_washing_story_multipliers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN pressure_washing_story_flat_fees JSONB DEFAULT '{}'::jsonb;

-- Update existing row with default values if it exists
UPDATE settings
SET
  pressure_washing_per_sqft_price = COALESCE(pressure_washing_per_sqft_price, 0.00),
  pressure_washing_flat_fee = COALESCE(pressure_washing_flat_fee, 0.00),
  pressure_washing_minimum_price = COALESCE(pressure_washing_minimum_price, 0.00),
  pressure_washing_story_multipliers = COALESCE(pressure_washing_story_multipliers, '{}'::jsonb),
  pressure_washing_story_flat_fees = COALESCE(pressure_washing_story_flat_fees, '{}'::jsonb)
WHERE id = '00000000-0000-0000-0000-000000000001';
