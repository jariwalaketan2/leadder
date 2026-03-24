-- Create businesses table for multi-tenant HVAC quote system
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#10B981',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on owner_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "businesses_select_own" ON public.businesses 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "businesses_insert_own" ON public.businesses 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "businesses_update_own" ON public.businesses 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "businesses_delete_own" ON public.businesses 
  FOR DELETE USING (auth.uid() = owner_id);
