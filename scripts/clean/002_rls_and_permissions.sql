-- ============================================================
-- 002_rls_and_permissions.sql
-- Enables RLS on every table with one clean policy each.
-- Multi-tenant pattern: all policies chain through businesses.owner_id.
--
-- Who accesses what:
--   Portal (browser, user JWT) → needs RLS to enforce tenant isolation
--   API routes (server, service_role) → bypasses RLS automatically
--   Widget API (server, service_role) → bypasses RLS automatically
-- ============================================================


-- ── Enable RLS ───────────────────────────────────────────────
ALTER TABLE public.businesses                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_options          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_product_configs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_system_configurations ENABLE ROW LEVEL SECURITY;


-- ── businesses ───────────────────────────────────────────────
-- Owner can do everything with their own business row.
CREATE POLICY "businesses_owner" ON public.businesses
  FOR ALL
  USING     (auth.uid() = owner_id)
  WITH CHECK(auth.uid() = owner_id);


-- ── products ─────────────────────────────────────────────────
-- Owner can manage; no public read needed (widget uses service_role).
CREATE POLICY "products_owner" ON public.products
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));


-- ── capacity_options ─────────────────────────────────────────
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


-- ── pricing_tiers ────────────────────────────────────────────
CREATE POLICY "pricing_tiers_owner" ON public.pricing_tiers
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));


-- ── leads ────────────────────────────────────────────────────
-- Owner can read/delete; inserts happen server-side via service_role.
CREATE POLICY "leads_owner" ON public.leads
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));


-- ── business_settings ────────────────────────────────────────
CREATE POLICY "business_settings_owner" ON public.business_settings
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));


-- ── business_product_configs ─────────────────────────────────
CREATE POLICY "business_product_configs_owner" ON public.business_product_configs
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));


-- ── tier_system_configurations ───────────────────────────────
CREATE POLICY "tier_system_configs_owner" ON public.tier_system_configurations
  FOR ALL
  USING (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  ));


-- ── Grants ───────────────────────────────────────────────────
-- service_role already has superuser-level access; these grants cover
-- the `authenticated` role used by portal browser clients.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
