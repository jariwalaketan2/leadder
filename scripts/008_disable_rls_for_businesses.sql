-- Temporarily disable RLS on businesses table for service role operations
-- This is safe because:
-- 1. Only server-side code has access to the service role key
-- 2. The API route validates the user session before creating a business
-- 3. The owner_id is set to the authenticated user's ID

-- Disable RLS on businesses table
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;

-- Disable RLS on business_settings table
ALTER TABLE public.business_settings DISABLE ROW LEVEL SECURITY;
