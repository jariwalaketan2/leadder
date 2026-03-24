-- Grant permissions on business_product_configs table
-- The 403 error persists even with RLS disabled, indicating missing table-level permissions

-- Grant all permissions to authenticated users
GRANT ALL ON public.business_product_configs TO authenticated;
GRANT ALL ON public.business_product_configs TO anon;

-- Grant usage on the sequence if it exists
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
