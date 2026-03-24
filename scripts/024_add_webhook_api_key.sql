-- Add webhook_api_key column to business_settings
ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS webhook_api_key TEXT DEFAULT NULL;
