-- Create tier_system_configurations table for "Apply to All" functionality
CREATE TABLE IF NOT EXISTS tier_system_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('good','better','best')),
  efficiency_description TEXT,
  warranty_years INT CHECK (warranty_years > 0 AND warranty_years <= 50),
  warranty_terms TEXT,
  features TEXT[], -- Array of feature strings
  scope_of_work TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, product_id, tier)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tier_system_configs_business_product 
  ON tier_system_configurations(business_id, product_id);

CREATE INDEX IF NOT EXISTS idx_tier_system_configs_tier 
  ON tier_system_configurations(tier);

-- Enable RLS
ALTER TABLE tier_system_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access configs for their own business
CREATE POLICY "tier_system_configs_own_business" ON tier_system_configurations
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE tier_system_configurations IS 
  'System-wide tier configurations that can be applied to all capacities of a product';

COMMENT ON COLUMN tier_system_configurations.efficiency_description IS 
  'Description of efficiency level for this tier (e.g., "Basic efficiency that meets minimum requirements")';

COMMENT ON COLUMN tier_system_configurations.warranty_years IS 
  'Number of years for warranty coverage';

COMMENT ON COLUMN tier_system_configurations.warranty_terms IS 
  'Detailed warranty terms and conditions';

COMMENT ON COLUMN tier_system_configurations.features IS 
  'Array of feature strings to display for this tier';

COMMENT ON COLUMN tier_system_configurations.scope_of_work IS 
  'Detailed description of what is included in this tier';

COMMENT ON COLUMN tier_system_configurations.image_url IS 
  'URL to image representing this tier (e.g., equipment photo)';

