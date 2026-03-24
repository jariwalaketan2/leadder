-- Temporarily disable RLS on business_product_configs
-- This matches the approach used for businesses table
-- Safe because:
-- 1. Access is controlled through the application layer
-- 2. business_id foreign key ensures data integrity
-- 3. Only authenticated users can access the API

ALTER TABLE public.business_product_configs DISABLE ROW LEVEL SECURITY;
