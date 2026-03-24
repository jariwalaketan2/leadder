-- Fix RLS policies to allow service role to bypass
-- Service role should be able to insert businesses during signup

-- Drop existing policies
DROP POLICY IF EXISTS "businesses_insert_own" ON public.businesses;
DROP POLICY IF EXISTS "business_settings_insert_own" ON public.business_settings;

-- Recreate insert policies with service role bypass
-- The service role check: auth.jwt() ->> 'role' = 'service_role'
CREATE POLICY "businesses_insert_own" ON public.businesses 
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id 
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "business_settings_insert_own" ON public.business_settings 
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Also allow service role to update and delete (for admin operations)
DROP POLICY IF EXISTS "businesses_update_own" ON public.businesses;
DROP POLICY IF EXISTS "businesses_delete_own" ON public.businesses;

CREATE POLICY "businesses_update_own" ON public.businesses 
  FOR UPDATE USING (
    auth.uid() = owner_id 
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "businesses_delete_own" ON public.businesses 
  FOR DELETE USING (
    auth.uid() = owner_id 
    OR auth.jwt() ->> 'role' = 'service_role'
  );
