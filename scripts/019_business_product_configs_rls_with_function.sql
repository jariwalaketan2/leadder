-- Alternative: Use a function for RLS check
-- This is more reliable in some Supabase configurations

-- Create a helper function to check business ownership
CREATE OR REPLACE FUNCTION public.user_owns_business(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_uuid 
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing policies
DROP POLICY IF EXISTS "business_product_configs_all" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_own_business" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_select" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_insert" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_update" ON business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_delete" ON business_product_configs;

-- Create policies using the function
CREATE POLICY "business_product_configs_select" ON business_product_configs
  FOR SELECT 
  USING (user_owns_business(business_id));

CREATE POLICY "business_product_configs_insert" ON business_product_configs
  FOR INSERT 
  WITH CHECK (user_owns_business(business_id));

CREATE POLICY "business_product_configs_update" ON business_product_configs
  FOR UPDATE 
  USING (user_owns_business(business_id))
  WITH CHECK (user_owns_business(business_id));

CREATE POLICY "business_product_configs_delete" ON business_product_configs
  FOR DELETE 
  USING (user_owns_business(business_id));
