-- Fix RLS policies for business_product_configs to allow INSERT and UPDATE

-- Drop the existing policy
DROP POLICY IF EXISTS "business_product_configs_own_business" ON business_product_configs;

-- Create separate policies for each operation
CREATE POLICY "business_product_configs_select" ON business_product_configs
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "business_product_configs_insert" ON business_product_configs
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "business_product_configs_update" ON business_product_configs
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "business_product_configs_delete" ON business_product_configs
  FOR DELETE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
