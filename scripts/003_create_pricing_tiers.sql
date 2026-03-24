-- Create pricing_tiers table for Good/Better/Best pricing
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('good', 'better', 'best')),
  capacity_value NUMERIC, -- e.g., 2, 2.5, 3, 3.5 tons or BTU value
  price NUMERIC NOT NULL,
  brand TEXT,
  model TEXT,
  seer_rating NUMERIC,
  warranty_years INTEGER,
  warranty_description TEXT,
  scope_of_work TEXT,
  image_url TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, tier, capacity_value)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_product_id ON public.pricing_tiers(product_id);

-- Enable RLS
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - via product ownership
CREATE POLICY "pricing_tiers_select_own" ON public.pricing_tiers 
  FOR SELECT USING (
    product_id IN (
      SELECT p.id FROM public.products p 
      JOIN public.businesses b ON p.business_id = b.id 
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "pricing_tiers_insert_own" ON public.pricing_tiers 
  FOR INSERT WITH CHECK (
    product_id IN (
      SELECT p.id FROM public.products p 
      JOIN public.businesses b ON p.business_id = b.id 
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "pricing_tiers_update_own" ON public.pricing_tiers 
  FOR UPDATE USING (
    product_id IN (
      SELECT p.id FROM public.products p 
      JOIN public.businesses b ON p.business_id = b.id 
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "pricing_tiers_delete_own" ON public.pricing_tiers 
  FOR DELETE USING (
    product_id IN (
      SELECT p.id FROM public.products p 
      JOIN public.businesses b ON p.business_id = b.id 
      WHERE b.owner_id = auth.uid()
    )
  );

-- Public read policy for widget access
CREATE POLICY "pricing_tiers_public_read" ON public.pricing_tiers 
  FOR SELECT USING (is_active = TRUE);
