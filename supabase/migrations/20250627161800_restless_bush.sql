/*
  # Seed Initial Data for CarbonAI Platform

  1. Seed Data
    - Sample carbon credits for the marketplace
*/

-- Seed carbon credits
INSERT INTO carbon_credits (type, price, quantity, location, verified, description, vintage, seller, certification, tags, rating, review_count)
VALUES
  ('forest', 45.50, 1000, 'Amazon Rainforest, Brazil', true, 'Protecting 500 hectares of primary rainforest', 2024, 'EcoForest Initiative', 'VCS', ARRAY['forest', 'conservation', 'biodiversity'], 4.2, 124),
  ('renewable', 32.75, 2500, 'Wind Farm, Texas', true, 'Clean energy from wind turbines', 2024, 'GreenWind Energy', 'Gold Standard', ARRAY['wind', 'energy', 'renewable'], 4.5, 87),
  ('efficiency', 28.90, 800, 'Industrial Complex, California', true, 'Energy efficiency improvements in manufacturing', 2023, 'EcoTech Solutions', 'CAR', ARRAY['efficiency', 'industrial', 'energy'], 3.9, 56),
  ('capture', 85.25, 500, 'Direct Air Capture, Iceland', true, 'Direct CO₂ capture and storage technology', 2024, 'CarbonCapture Inc.', 'VCS', ARRAY['technology', 'capture', 'innovative'], 4.7, 32),
  ('forest', 42.30, 1500, 'Borneo Rainforest, Indonesia', true, 'Conservation of endangered orangutan habitat', 2023, 'Wildlife Conservation Fund', 'Gold Standard', ARRAY['forest', 'wildlife', 'biodiversity'], 4.3, 98),
  ('renewable', 29.95, 3000, 'Solar Farm, Arizona', true, 'Solar energy generation project', 2024, 'SunPower Solutions', 'VCS', ARRAY['solar', 'energy', 'renewable'], 4.1, 112),
  ('efficiency', 35.50, 600, 'Commercial Buildings, New York', true, 'Energy efficiency retrofits for office buildings', 2023, 'Urban Efficiency Corp', 'CAR', ARRAY['buildings', 'urban', 'efficiency'], 4.0, 45),
  ('capture', 92.75, 300, 'Ocean Carbon Capture, Pacific', true, 'Innovative ocean-based carbon sequestration', 2024, 'OceanCapture Technologies', 'Gold Standard', ARRAY['ocean', 'innovative', 'capture'], 4.6, 28);