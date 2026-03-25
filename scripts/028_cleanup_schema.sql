-- ============================================================
-- 028_cleanup_schema.sql
-- Run on EXISTING databases to:
--   1. Drop unused columns (GHL, legacy fields)
--   2. Replace all old/duplicate RLS policies with clean single policies
-- Safe to re-run: uses IF EXISTS / DROP POLICY IF EXISTS guards.
-- ============================================================


-- ── 1. Drop unused columns ────────────────────────────────────

-- leads: remove GHL, status, notes, old capacity field
ALTER TABLE public.leads
  DROP COLUMN IF EXISTS capacity_selected,
  DROP COLUMN IF EXISTS ghl_contact_id,
  DROP COLUMN IF EXISTS ghl_opportunity_id,
  DROP COLUMN IF EXISTS ghl_synced_at,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS notes;

-- business_settings: remove GHL, financing, email notifications
ALTER TABLE public.business_settings
  DROP COLUMN IF EXISTS ghl_api_key,
  DROP COLUMN IF EXISTS ghl_location_id,
  DROP COLUMN IF EXISTS ghl_pipeline_id,
  DROP COLUMN IF EXISTS ghl_stage_id,
  DROP COLUMN IF EXISTS ghl_enabled,
  DROP COLUMN IF EXISTS widget_show_financing,
  DROP COLUMN IF EXISTS webhook_api_key,
  DROP COLUMN IF EXISTS email_notifications,
  DROP COLUMN IF EXISTS notification_email,
  DROP COLUMN IF EXISTS widget_cta_text;

-- pricing_tiers: remove old legacy columns
ALTER TABLE public.pricing_tiers
  DROP COLUMN IF EXISTS capacity_value,
  DROP COLUMN IF EXISTS brand,
  DROP COLUMN IF EXISTS model,
  DROP COLUMN IF EXISTS seer_rating,
  DROP COLUMN IF EXISTS warranty_description,
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS label;

-- tier_system_configurations: remove unused columns
ALTER TABLE public.tier_system_configurations
  DROP COLUMN IF EXISTS warranty_terms,
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS features;

-- products: remove old columns superseded by display_order
ALTER TABLE public.products
  DROP COLUMN IF EXISTS capacity_unit,
  DROP COLUMN IF EXISTS sort_order;


-- ── 2. Replace messy RLS policies with clean single policies ─

-- businesses
DROP POLICY IF EXISTS businesses_select_own ON public.businesses;
DROP POLICY IF EXISTS businesses_insert_own ON public.businesses;
DROP POLICY IF EXISTS businesses_update_own ON public.businesses;
DROP POLICY IF EXISTS businesses_delete_own ON public.businesses;
DROP POLICY IF EXISTS "businesses_owner"    ON public.businesses;
CREATE POLICY "businesses_owner" ON public.businesses
  FOR ALL
  USING     (auth.uid() = owner_id)
  WITH CHECK(auth.uid() = owner_id);

-- products
DROP POLICY IF EXISTS products_select_own      ON public.products;
DROP POLICY IF EXISTS products_insert_own      ON public.products;
DROP POLICY IF EXISTS products_update_own      ON public.products;
DROP POLICY IF EXISTS products_delete_own      ON public.products;
DROP POLICY IF EXISTS products_public_read     ON public.products;
DROP POLICY IF EXISTS "products_owner"         ON public.products;
CREATE POLICY "products_owner" ON public.products
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));

-- capacity_options
DROP POLICY IF EXISTS capacity_options_public_read ON public.capacity_options;
DROP POLICY IF EXISTS "capacity_options_owner"     ON public.capacity_options;
CREATE POLICY "capacity_options_owner" ON public.capacity_options
  FOR ALL
  USING (product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.businesses b ON p.business_id = b.id
    WHERE b.owner_id = auth.uid()
  ))
  WITH CHECK (product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.businesses b ON p.business_id = b.id
    WHERE b.owner_id = auth.uid()
  ));

-- pricing_tiers
DROP POLICY IF EXISTS pricing_tiers_select_own          ON public.pricing_tiers;
DROP POLICY IF EXISTS pricing_tiers_insert_own          ON public.pricing_tiers;
DROP POLICY IF EXISTS pricing_tiers_update_own          ON public.pricing_tiers;
DROP POLICY IF EXISTS pricing_tiers_delete_own          ON public.pricing_tiers;
DROP POLICY IF EXISTS pricing_tiers_public_read         ON public.pricing_tiers;
DROP POLICY IF EXISTS pricing_tiers_insert_service_role ON public.pricing_tiers;
DROP POLICY IF EXISTS pricing_tiers_update_service_role ON public.pricing_tiers;
DROP POLICY IF EXISTS "pricing_tiers_owner"             ON public.pricing_tiers;
CREATE POLICY "pricing_tiers_owner" ON public.pricing_tiers
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));

-- leads
DROP POLICY IF EXISTS leads_select_own    ON public.leads;
DROP POLICY IF EXISTS leads_insert_own    ON public.leads;
DROP POLICY IF EXISTS leads_update_own    ON public.leads;
DROP POLICY IF EXISTS leads_delete_own    ON public.leads;
DROP POLICY IF EXISTS leads_public_insert ON public.leads;
DROP POLICY IF EXISTS "leads_owner"       ON public.leads;
CREATE POLICY "leads_owner" ON public.leads
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));

-- business_settings
DROP POLICY IF EXISTS business_settings_select_own ON public.business_settings;
DROP POLICY IF EXISTS business_settings_insert_own ON public.business_settings;
DROP POLICY IF EXISTS business_settings_update_own ON public.business_settings;
DROP POLICY IF EXISTS business_settings_delete_own ON public.business_settings;
DROP POLICY IF EXISTS "business_settings_owner"    ON public.business_settings;
CREATE POLICY "business_settings_owner" ON public.business_settings
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));

-- business_product_configs
DROP POLICY IF EXISTS business_product_configs_own_business ON public.business_product_configs;
DROP POLICY IF EXISTS "business_product_configs_owner"      ON public.business_product_configs;
CREATE POLICY "business_product_configs_owner" ON public.business_product_configs
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));

-- tier_system_configurations
DROP POLICY IF EXISTS tier_system_configs_own_business ON public.tier_system_configurations;
DROP POLICY IF EXISTS "tier_system_configs_owner"      ON public.tier_system_configurations;
CREATE POLICY "tier_system_configs_owner" ON public.tier_system_configurations
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));


-- ── 3. Ensure RLS is ON everywhere (idempotent) ──────────────
ALTER TABLE public.businesses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_options           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_product_configs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_system_configurations ENABLE ROW LEVEL SECURITY;


-- ── 4. Grants ────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
