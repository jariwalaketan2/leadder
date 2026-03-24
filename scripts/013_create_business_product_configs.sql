-- Create business_product_configs table with enhanced pricing features
CREATE TABLE IF NOT EXISTS business_product_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  price_range_pct DECIMAL(5,2) DEFAULT 0 CHECK (price_range_pct >= 0 AND price_range_pct <= 100),
  multi_unit_discount_pct DECIMAL(5,2) DEFAULT 0 CHECK (multi_unit_discount_pct >= 0 AND multi_unit_discount_pct <= 100),
  attic_additional_cost DECIMAL(10,2) DEFAULT 0 CHECK (attic_additional_cost >= 0),
  basement_additional_cost DECIMAL(10,2) DEFAULT 0 CHECK (basement_additional_cost >= 0),
  closet_additional_cost DECIMAL(10,2) DEFAULT 0 CHECK (closet_additional_cost >= 0),
  garage_additional_cost DECIMAL(10,2) DEFAULT 0 CHECK (garage_additional_cost >= 0),
  crawl_space_additional_cost DECIMAL(10,2) DEFAULT 0 CHECK (crawl_space_additional_cost >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, product_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_product_configs_business_id 
  ON business_product_configs(business_id);

CREATE INDEX IF NOT EXISTS idx_business_product_configs_product_id 
  ON business_product_configs(product_id);

-- Enable RLS
ALTER TABLE business_product_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access configs for their own business
CREATE POLICY "business_product_configs_own_business" ON business_product_configs
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE business_product_configs IS 
  'Configuration settings for products offered by each business, including pricing adjustments and location costs';

COMMENT ON COLUMN business_product_configs.is_enabled IS 
  'Whether this product is visible in the public widget';

COMMENT ON COLUMN business_product_configs.price_range_pct IS 
  'Percentage to add for price range display (e.g., 10% converts $8000 to $8000-$8800)';

COMMENT ON COLUMN business_product_configs.multi_unit_discount_pct IS 
  'Discount percentage for multiple unit installations';

COMMENT ON COLUMN business_product_configs.attic_additional_cost IS 
  'Additional cost when installation location is attic';

COMMENT ON COLUMN business_product_configs.basement_additional_cost IS 
  'Additional cost when installation location is basement';

COMMENT ON COLUMN business_product_configs.closet_additional_cost IS 
  'Additional cost when installation location is closet';

COMMENT ON COLUMN business_product_configs.garage_additional_cost IS 
  'Additional cost when installation location is garage';

COMMENT ON COLUMN business_product_configs.crawl_space_additional_cost IS 
  'Additional cost when installation location is crawl space';

