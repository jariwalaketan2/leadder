-- Create leads table for capturing homeowner inquiries
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  pricing_tier_id UUID REFERENCES public.pricing_tiers(id) ON DELETE SET NULL,
  
  -- Contact info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Quote details
  product_name TEXT,
  tier_selected TEXT CHECK (tier_selected IN ('good', 'better', 'best')),
  capacity_selected NUMERIC,
  quoted_price NUMERIC,
  
  -- Status tracking
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'quoted', 'won', 'lost')),
  notes TEXT,
  
  -- GHL integration
  ghl_contact_id TEXT,
  ghl_opportunity_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_business_id ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "leads_select_own" ON public.leads 
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "leads_insert_own" ON public.leads 
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "leads_update_own" ON public.leads 
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "leads_delete_own" ON public.leads 
  FOR DELETE USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

-- Public insert policy for widget submissions (anonymous users can submit leads)
CREATE POLICY "leads_public_insert" ON public.leads 
  FOR INSERT WITH CHECK (TRUE);
