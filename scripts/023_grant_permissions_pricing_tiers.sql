-- Grant permissions on pricing_tiers table for inline editing
-- Users need to be able to create and update pricing tiers from the pricing grid

GRANT ALL ON public.pricing_tiers TO authenticated;
GRANT ALL ON public.pricing_tiers TO anon;
