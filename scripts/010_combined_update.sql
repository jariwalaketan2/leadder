-- =============================================================
-- Combined schema update (replaces scripts 011–016 + 018)
-- Run this ONCE after the original 001–009 scripts.
-- Safe to re-run: all changes use IF NOT EXISTS / IF EXISTS guards.
-- =============================================================


-- ── 1. CAPACITY OPTIONS TABLE ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.capacity_options (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label          TEXT NOT NULL,       -- "2 Ton", "80k BTU"
  value          TEXT NOT NULL,       -- "2", "80000"
  unit           TEXT NOT NULL,       -- "ton", "btu"
  display_order  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capacity_options_product_id
  ON public.capacity_options(product_id);

ALTER TABLE public.capacity_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "capacity_options_public_read" ON public.capacity_options
  FOR SELECT USING (TRUE);


-- ── 2. PRICING TIERS — add missing columns ────────────────────

ALTER TABLE public.pricing_tiers
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.pricing_tiers
  ADD COLUMN IF NOT EXISTS capacity_option_id UUID REFERENCES public.capacity_options(id) ON DELETE SET NULL;

ALTER TABLE public.pricing_tiers
  DROP CONSTRAINT IF EXISTS pricing_tiers_product_id_tier_capacity_value_key;

CREATE UNIQUE INDEX IF NOT EXISTS pricing_tiers_unique_idx
  ON public.pricing_tiers (business_id, product_id, capacity_option_id, tier)
  WHERE business_id IS NOT NULL;

CREATE POLICY "pricing_tiers_insert_service_role" ON public.pricing_tiers
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "pricing_tiers_update_service_role" ON public.pricing_tiers
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');


-- ── 3. BUSINESS SETTINGS — add missing columns ────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_settings'
    AND column_name = 'widget_success_message'
  ) THEN
    ALTER TABLE public.business_settings
      RENAME COLUMN widget_success_message TO widget_thank_you_message;
  END IF;
END $$;

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS ghl_enabled           BOOLEAN       DEFAULT FALSE;

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS widget_show_financing BOOLEAN       DEFAULT FALSE;

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS price_range_pct       DECIMAL(5,2)  DEFAULT 0;

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS webhook_url           TEXT          DEFAULT NULL;


-- ── 4. LEADS — add missing columns ───────────────────────────

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS capacity_option_id UUID REFERENCES public.capacity_options(id) ON DELETE SET NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS capacity_label TEXT;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ghl_synced_at      TIMESTAMPTZ;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ghl_contact_id     TEXT;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ghl_opportunity_id TEXT;


-- ── 5. PRODUCTS — add display_order, fix category values ──────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

UPDATE public.products
  SET display_order = sort_order
  WHERE display_order = 0 AND sort_order > 0;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('equipment', 'service'));

UPDATE public.products SET category = 'equipment' WHERE category = 'hvac';


-- ── 6. FUNCTIONS — seed products + updated signup function ────

CREATE OR REPLACE FUNCTION public.seed_phase1_products(p_business_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id        UUID;
  tonnage_labels      TEXT[] := ARRAY['1.5 Ton','2 Ton','2.5 Ton','3 Ton','3.5 Ton','4 Ton','5 Ton'];
  tonnage_values      TEXT[] := ARRAY['1.5','2','2.5','3','3.5','4','5'];
  mini_split_labels   TEXT[] := ARRAY['1.5 Ton','2 Ton','2.5 Ton','3 Ton','3.5 Ton','4 Ton'];
  mini_split_values   TEXT[] := ARRAY['1.5','2','2.5','3','3.5','4'];
  btu_labels          TEXT[] := ARRAY['40k BTU','60k BTU','80k BTU','100k BTU','120k BTU'];
  btu_values          TEXT[] := ARRAY['40000','60000','80000','100000','120000'];
  i INT;
BEGIN
  INSERT INTO public.products (business_id, name, slug, category, description, icon, display_order, is_active)
  VALUES (p_business_id, 'Split System - Gas Furnace', 'split-system-gas-furnace', 'equipment',
    'Complete split system with gas furnace and AC', 'Zap', 1, true)
  RETURNING id INTO v_product_id;
  FOR i IN 1..7 LOOP
    INSERT INTO public.capacity_options (product_id, label, value, unit, display_order)
    VALUES (v_product_id, tonnage_labels[i], tonnage_values[i], 'ton', i);
  END LOOP;

  INSERT INTO public.products (business_id, name, slug, category, description, icon, display_order, is_active)
  VALUES (p_business_id, 'Split System - Cooling Only', 'split-system-cooling-only', 'equipment',
    'Central air conditioning split system', 'Snowflake', 2, true)
  RETURNING id INTO v_product_id;
  FOR i IN 1..7 LOOP
    INSERT INTO public.capacity_options (product_id, label, value, unit, display_order)
    VALUES (v_product_id, tonnage_labels[i], tonnage_values[i], 'ton', i);
  END LOOP;

  INSERT INTO public.products (business_id, name, slug, category, description, icon, display_order, is_active)
  VALUES (p_business_id, 'Mini Split', 'mini-split', 'equipment',
    'Ductless mini split heating and cooling system', 'Wind', 3, true)
  RETURNING id INTO v_product_id;
  FOR i IN 1..6 LOOP
    INSERT INTO public.capacity_options (product_id, label, value, unit, display_order)
    VALUES (v_product_id, mini_split_labels[i], mini_split_values[i], 'ton', i);
  END LOOP;

  INSERT INTO public.products (business_id, name, slug, category, description, icon, display_order, is_active)
  VALUES (p_business_id, 'Packaged System', 'packaged-system', 'equipment',
    'All-in-one rooftop packaged HVAC unit', 'Fan', 4, true)
  RETURNING id INTO v_product_id;
  FOR i IN 1..7 LOOP
    INSERT INTO public.capacity_options (product_id, label, value, unit, display_order)
    VALUES (v_product_id, tonnage_labels[i], tonnage_values[i], 'ton', i);
  END LOOP;

  INSERT INTO public.products (business_id, name, slug, category, description, icon, display_order, is_active)
  VALUES (p_business_id, 'Furnace', 'furnace', 'equipment',
    'Gas or electric furnace replacement', 'Flame', 5, true)
  RETURNING id INTO v_product_id;
  FOR i IN 1..5 LOOP
    INSERT INTO public.capacity_options (product_id, label, value, unit, display_order)
    VALUES (v_product_id, btu_labels[i], btu_values[i], 'btu', i);
  END LOOP;

  INSERT INTO public.products (business_id, name, slug, category, description, icon, display_order, is_active)
  VALUES (p_business_id, 'Boiler', 'boiler', 'equipment',
    'Hot water or steam boiler replacement', 'Thermometer', 6, true)
  RETURNING id INTO v_product_id;
  FOR i IN 1..5 LOOP
    INSERT INTO public.capacity_options (product_id, label, value, unit, display_order)
    VALUES (v_product_id, btu_labels[i], btu_values[i], 'btu', i);
  END LOOP;

  INSERT INTO public.products (business_id, name, slug, category, description, icon, display_order, is_active)
  VALUES (p_business_id, 'Dual Fuel System', 'dual-fuel-system', 'equipment',
    'Heat pump with gas furnace backup', 'Zap', 7, true)
  RETURNING id INTO v_product_id;
  FOR i IN 1..7 LOOP
    INSERT INTO public.capacity_options (product_id, label, value, unit, display_order)
    VALUES (v_product_id, tonnage_labels[i], tonnage_values[i], 'ton', i);
  END LOOP;

  INSERT INTO public.products (business_id, name, slug, category, description, icon, display_order, is_active)
  VALUES (p_business_id, 'Split System - Heat Pump', 'split-system-heat-pump', 'equipment',
    'Electric heat pump for heating and cooling', 'Thermometer', 8, true)
  RETURNING id INTO v_product_id;
  FOR i IN 1..7 LOOP
    INSERT INTO public.capacity_options (product_id, label, value, unit, display_order)
    VALUES (v_product_id, tonnage_labels[i], tonnage_values[i], 'ton', i);
  END LOOP;

  INSERT INTO public.products (business_id, name, slug, category, description, icon, display_order, is_active)
  VALUES (p_business_id, 'HVAC System Tune-Up', 'hvac-tune-up', 'service',
    'Professional HVAC maintenance and tune-up service', 'Wrench', 9, true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_phase1_products TO service_role;

CREATE OR REPLACE FUNCTION public.create_business_with_settings(
  p_owner_id UUID,
  p_name     TEXT,
  p_slug     TEXT,
  p_email    TEXT
)
RETURNS TABLE (business_id UUID, business_name TEXT, business_slug TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id UUID;
BEGIN
  INSERT INTO public.businesses (owner_id, name, slug, email)
  VALUES (p_owner_id, p_name, p_slug, p_email)
  RETURNING id INTO v_business_id;

  INSERT INTO public.business_settings (business_id, notification_email)
  VALUES (v_business_id, p_email);

  PERFORM public.seed_phase1_products(v_business_id);

  RETURN QUERY SELECT v_business_id, p_name, p_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_business_with_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_business_with_settings TO service_role;


-- ── 7. SEED EXISTING BUSINESSES (safe — skips any that already have products) ─

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT b.id
    FROM public.businesses b
    WHERE NOT EXISTS (
      SELECT 1 FROM public.products p WHERE p.business_id = b.id
    )
  LOOP
    PERFORM public.seed_phase1_products(r.id);
    RAISE NOTICE 'Seeded products for business %', r.id;
  END LOOP;
END $$;
