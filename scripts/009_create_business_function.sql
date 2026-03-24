-- Create a PostgreSQL function that bypasses RLS for business creation
-- This function runs with SECURITY DEFINER, meaning it runs with the privileges
-- of the user who created it (the database owner), bypassing RLS

CREATE OR REPLACE FUNCTION public.create_business_with_settings(
  p_owner_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_email TEXT
)
RETURNS TABLE (
  business_id UUID,
  business_name TEXT,
  business_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Insert business
  INSERT INTO public.businesses (owner_id, name, slug, email)
  VALUES (p_owner_id, p_name, p_slug, p_email)
  RETURNING id INTO v_business_id;
  
  -- Insert business settings
  INSERT INTO public.business_settings (business_id, notification_email)
  VALUES (v_business_id, p_email);
  
  -- Return the business info
  RETURN QUERY
  SELECT v_business_id, p_name, p_slug;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_business_with_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_business_with_settings TO service_role;
