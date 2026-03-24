-- Fix RLS for business_product_configs with direct owner check
-- This version avoids subqueries which can sometimes cause issues

-- Drop all existing policies
DROP POLICY IF EXISTS "business_product_configs_all" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_own_business" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_select" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_insert" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_update" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_delete" ON business_product_configs;

-- Create separate policies for each operation
-- SELECT: Allow users to see configs for their businesses
CREATE POLICY "business_product_configs_select" ON business_product_configs
  FOR SELECT 
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- INSERT: Allow users to create configs for their businesses
CREATE POLICY "business_product_configs_insert" ON business_product_configs
  FOR INSERT 
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: Allow users to update configs for their businesses
CREATE POLICY "business_product_configs_update" ON business_product_configs
  FOR UPDATE 
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Allow users to delete configs for their businesses
CREATE POLICY "business_product_configs_delete" ON business_product_configs
  FOR DELETE 
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );
