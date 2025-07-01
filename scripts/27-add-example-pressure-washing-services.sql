INSERT INTO public.services (
    name,
    display_name,
    description,
    category,
    per_sqft_price,
    flat_fee,
    use_both_pricing,
    minimum_price,
    is_active,
    display_order
) VALUES
('house-wash', 'House Wash', 'Soft wash exterior of your home', 'pressure-washing', 0.25, 0.00, FALSE, 200.00, TRUE, 100),
('driveway-cleaning', 'Driveway Cleaning', 'Pressure wash concrete or paved driveways', 'pressure-washing', 0.15, 0.00, FALSE, 100.00, TRUE, 110),
('deck-patio-cleaning', 'Deck & Patio Cleaning', 'Clean and restore decks and patios', 'pressure-washing', 0.20, 0.00, FALSE, 150.00, TRUE, 120),
('commercial-building-wash', 'Commercial Building Wash', 'Exterior cleaning for commercial properties', 'commercial-pressure-washing', NULL, NULL, FALSE, NULL, TRUE, 200),
('commercial-concrete-cleaning', 'Commercial Concrete Cleaning', 'Pressure wash large concrete areas for businesses', 'commercial-pressure-washing', NULL, NULL, FALSE, NULL, TRUE, 210)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    per_sqft_price = EXCLUDED.per_sqft_price,
    flat_fee = EXCLUDED.flat_fee,
    use_both_pricing = EXCLUDED.use_both_pricing,
    minimum_price = EXCLUDED.minimum_price,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order;
