-- Fix permissions for tables that are failing with 42501 (permission denied)
-- Run this in Supabase SQL Editor

-- business_product_configs
ALTER TABLE public.business_product_configs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.business_product_configs TO authenticated;
GRANT ALL ON public.business_product_configs TO anon;
GRANT ALL ON public.business_product_configs TO service_role;

-- tier_system_configurations
ALTER TABLE public.tier_system_configurations DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.tier_system_configurations TO authenticated;
GRANT ALL ON public.tier_system_configurations TO anon;
GRANT ALL ON public.tier_system_configurations TO service_role;
