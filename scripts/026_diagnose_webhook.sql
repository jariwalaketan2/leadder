-- Run this in Supabase SQL Editor to diagnose webhook issues

-- 1. Check if webhook_url column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'business_settings'
  AND column_name = 'webhook_url';

-- 2. Check what webhook_url value is stored for each business
SELECT
  b.name AS business_name,
  bs.webhook_url,
  bs.widget_enabled,
  bs.updated_at
FROM businesses b
LEFT JOIN business_settings bs ON bs.business_id = b.id
ORDER BY b.created_at DESC;
