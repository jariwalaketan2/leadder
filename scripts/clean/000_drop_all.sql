-- ============================================================
-- 000_drop_all.sql
-- WARNING: Destroys all data. Only run on a fresh Supabase project.
-- ============================================================

DROP TABLE IF EXISTS tier_system_configurations CASCADE;
DROP TABLE IF EXISTS business_product_configs CASCADE;
DROP TABLE IF EXISTS pricing_tiers CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS capacity_options CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

DROP FUNCTION IF EXISTS public.seed_phase1_products(UUID);
DROP FUNCTION IF EXISTS public.create_business_with_settings(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.seed_default_products(UUID);
