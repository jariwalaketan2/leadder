-- Create business_settings table for GHL integration and other settings
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  
  -- GHL Integration settings
  ghl_api_key TEXT,
  ghl_location_id TEXT,
  ghl_pipeline_id TEXT,
  ghl_stage_id TEXT,
  
  -- Widget settings
  widget_title TEXT DEFAULT 'Get Your Instant Quote',
  widget_subtitle TEXT DEFAULT 'Select a service to get started',
  widget_cta_text TEXT DEFAULT 'Get My Quote',
  widget_success_message TEXT DEFAULT 'Thank you! We''ll be in touch shortly.',
  
  -- Notification settings
  email_notifications BOOLEAN DEFAULT TRUE,
  notification_email TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "business_settings_select_own" ON public.business_settings 
  FOR SELECT USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "business_settings_insert_own" ON public.business_settings 
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "business_settings_update_own" ON public.business_settings 
  FOR UPDATE USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "business_settings_delete_own" ON public.business_settings 
  FOR DELETE USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );
