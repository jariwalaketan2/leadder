-- Grant permissions on capacity_options table for updating is_enabled
-- Users need to be able to toggle capacity enable/disable from the pricing grid

GRANT ALL ON public.capacity_options TO authenticated;
GRANT ALL ON public.capacity_options TO anon;
