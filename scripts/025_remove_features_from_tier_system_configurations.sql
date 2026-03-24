-- Remove features column from tier_system_configurations table
-- Features will remain in pricing_tiers table for individual capacity pricing

ALTER TABLE tier_system_configurations 
DROP COLUMN IF EXISTS features;

-- Drop comment on the removed column (if exists)
COMMENT ON COLUMN tier_system_configurations.features IS NULL;

-- Update table comment to reflect the change
COMMENT ON TABLE tier_system_configurations IS 
  'System-wide tier configurations (efficiency, warranty, scope) that can be applied to all capacities of a product. Features are managed at the pricing_tiers level.';
