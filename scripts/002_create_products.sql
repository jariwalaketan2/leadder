-- Create products table with 8 HVAC products + 1 service
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hvac', 'service')),
  description TEXT,
  icon TEXT,
  capacity_unit TEXT CHECK (capacity_unit IN ('ton', 'btu', 'none')),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, slug)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies - business owner can manage their products
CREATE POLICY "products_select_own" ON public.products 
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_insert_own" ON public.products 
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_update_own" ON public.products 
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_delete_own" ON public.products 
  FOR DELETE USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- Public read policy for widget access (products need to be visible to homeowners)
CREATE POLICY "products_public_read" ON public.products 
  FOR SELECT USING (is_active = TRUE);
