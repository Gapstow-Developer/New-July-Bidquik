-- Safely remove old pressure washing pricing columns from settings table if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='pressure_washing_per_sqft_price') THEN
        ALTER TABLE settings DROP COLUMN pressure_washing_per_sqft_price;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='pressure_washing_flat_fee') THEN
        ALTER TABLE settings DROP COLUMN pressure_washing_flat_fee;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='pressure_washing_minimum_price') THEN
        ALTER TABLE settings DROP COLUMN pressure_washing_minimum_price;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='pressure_washing_story_multipliers') THEN
        ALTER TABLE settings DROP COLUMN pressure_washing_story_multipliers;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settings' AND column_name='pressure_washing_story_flat_fees') THEN
        ALTER TABLE settings DROP COLUMN pressure_washing_story_flat_fees;
    END IF;
END $$;

-- Insert residential pressure washing services
INSERT INTO services (id, name, display_name, description, category, per_sqft_price, flat_fee, use_both_pricing, minimum_price, is_active, display_order)
VALUES
    (gen_random_uuid(), 'whole-house-soft-wash', 'Whole House Soft Wash', 'Gentle cleaning for your entire home exterior.', 'pressure-washing', 0.25, NULL, FALSE, 250.00, TRUE, 100),
    (gen_random_uuid(), 'roof-wash', 'Roof Wash', 'Removes moss, algae, and stains from your roof.', 'pressure-washing', 0.35, NULL, FALSE, 300.00, TRUE, 110),
    (gen_random_uuid(), 'driveway-cleaning', 'Driveway Cleaning', 'Removes dirt, oil, and grime from concrete/paver driveways.', 'pressure-washing', 0.15, NULL, FALSE, 100.00, TRUE, 120),
    (gen_random_uuid(), 'patio-deck-cleaning', 'Patio & Deck Cleaning', 'Restores the look of your patio or deck.', 'pressure-washing', 0.18, NULL, FALSE, 120.00, TRUE, 130),
    (gen_random_uuid(), 'fence-cleaning', 'Fence Cleaning', 'Cleans and brightens wood or vinyl fences.', 'pressure-washing', 0.10, NULL, FALSE, 80.00, TRUE, 140),
    (gen_random_uuid(), 'concrete-walkway-cleaning', 'Concrete Walkway Cleaning', 'Cleaning of concrete walkways and paths.', 'pressure-washing', 0.12, NULL, FALSE, 70.00, TRUE, 150),
    (gen_random_uuid(), 'pool-deck-cleaning', 'Pool Deck Cleaning', 'Cleaning around pool areas, removing mildew and stains.', 'pressure-washing', 0.20, NULL, FALSE, 150.00, TRUE, 160),
    (gen_random_uuid(), 'siding-cleaning', 'Siding Cleaning', 'Removes dirt, grime, and mildew from all types of siding.', 'pressure-washing', 0.22, NULL, FALSE, 200.00, TRUE, 170),
    (gen_random_uuid(), 'gutter-exterior-cleaning', 'Gutter Exterior Cleaning', 'Cleans the outside of gutters, removing tiger stripes and stains.', 'pressure-washing', NULL, 75.00, FALSE, 75.00, TRUE, 180),
    (gen_random_uuid(), 'brick-cleaning', 'Brick Cleaning', 'Specialized cleaning for brick surfaces.', 'pressure-washing', 0.28, NULL, FALSE, 220.00, TRUE, 190)
ON CONFLICT (name) DO NOTHING;

-- Insert commercial pressure washing services (no pricing, just for selection)
INSERT INTO services (id, name, display_name, description, category, per_sqft_price, flat_fee, use_both_pricing, minimum_price, is_active, display_order)
VALUES
    (gen_random_uuid(), 'commercial-building-exterior', 'Building Exterior Cleaning', 'Cleaning of commercial building facades.', 'commercial-pressure-washing', NULL, NULL, FALSE, NULL, TRUE, 200),
    (gen_random_uuid(), 'commercial-sidewalk-entryway', 'Sidewalk & Entryway Cleaning', 'Cleaning of high-traffic pedestrian areas.', 'commercial-pressure-washing', NULL, NULL, FALSE, NULL, TRUE, 210),
    (gen_random_uuid(), 'commercial-parking-lot', 'Parking Lot Cleaning', 'Pressure washing for parking lots and garages.', 'commercial-pressure-washing', NULL, NULL, FALSE, NULL, TRUE, 220),
    (gen_random_uuid(), 'commercial-dumpster-pad', 'Dumpster Pad Cleaning', 'Sanitization and cleaning of dumpster areas.', 'commercial-pressure-washing', NULL, NULL, FALSE, NULL, TRUE, 230),
    (gen_random_uuid(), 'commercial-graffiti-removal', 'Graffiti Removal', 'Specialized service for graffiti removal.', 'commercial-pressure-washing', NULL, NULL, FALSE, NULL, TRUE, 240)
ON CONFLICT (name) DO NOTHING;
