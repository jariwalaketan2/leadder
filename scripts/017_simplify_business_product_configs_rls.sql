-- Simplify RLS policies for business_product_configs

-- Drop all existing policies
DROP POLICY IF EXISTS "business_product_configs_own_business" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_select" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_insert" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_update" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_delete" ON business_product_configs;

-- Create a simple policy that allows all operations for the business owner
CREATE POLICY "business_product_configs_all" ON business_product_configs
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_product_configs.business_id 
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_product_configs.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );
