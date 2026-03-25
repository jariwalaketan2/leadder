-- Run in Supabase SQL Editor
-- Adds three-tier price columns to support showing Good/Better/Best on confirmation

ALTER TABLE leads ADD COLUMN IF NOT EXISTS price_good    DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS price_better  DECIMAL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS price_best    DECIMAL;
