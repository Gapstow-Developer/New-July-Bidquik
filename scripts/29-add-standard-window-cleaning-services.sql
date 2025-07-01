-- Add standard window cleaning services
-- First, let's clean up any existing window cleaning services to avoid duplicates
DELETE FROM services WHERE category IN ('window-cleaning', 'window-cleaning-addon', 'additional-window-service');

-- Main Window Cleaning Services (Radio button selection)
INSERT INTO services (name, display_name, description, category, per_sqft_price, flat_fee, use_both_pricing, minimum_price, is_active, display_order) VALUES
('exterior-only', 'Exterior Only', 'Clean outside windows only', 'window-cleaning', 0.15, 0, false, 150, true, 10),
('interior-exterior', 'Interior & Exterior', 'Clean both inside and outside windows', 'window-cleaning', 0.25, 0, false, 200, true, 20),
('interior-only', 'Interior Only', 'Clean inside windows only', 'window-cleaning', 0.12, 0, false, 120, true, 30),
('post-construction', 'Post-Construction Cleaning', 'Heavy-duty cleaning for new construction', 'window-cleaning', 0.35, 50, true, 300, true, 40);

-- Window Cleaning Add-ons (Checkbox selection)
INSERT INTO services (name, display_name, description, category, per_sqft_price, flat_fee, use_both_pricing, minimum_price, is_active, display_order) VALUES
('tracks-sills', 'Tracks & Sills', 'Clean window tracks and sills', 'window-cleaning-addon', null, 35, false, null, true, 10),
('screens', 'Screen Cleaning', 'Remove, clean, and reinstall window screens', 'window-cleaning-addon', null, 45, false, null, true, 20),
('storm-windows', 'Storm Windows', 'Clean storm windows', 'window-cleaning-addon', null, 25, false, null, true, 30),
('french-panes', 'French Panes', 'Additional charge for multi-pane windows', 'window-cleaning-addon', null, 40, false, null, true, 40),
('hard-water-stains', 'Hard Water Stain Removal', 'Remove mineral deposits and hard water stains', 'window-cleaning-addon', null, 60, false, null, true, 50);

-- Additional Services (Checkbox selection)
INSERT INTO services (name, display_name, description, category, per_sqft_price, flat_fee, use_both_pricing, minimum_price, is_active, display_order) VALUES
('gutter-cleaning', 'Gutter Cleaning', 'Clean gutters while on-site', 'additional-window-service', null, 150, false, null, true, 10),
('light-pressure-wash', 'Window Frame Cleaning', 'Light pressure washing of window frames', 'additional-window-service', null, 75, false, null, true, 20),
('solar-panel-cleaning', 'Solar Panel Cleaning', 'Clean solar panels', 'additional-window-service', null, 125, false, null, true, 30),
('chandelier-cleaning', 'Chandelier Cleaning', 'Interior light fixture cleaning', 'additional-window-service', null, 85, false, null, true, 40);
