-- Add widget_enabled column to business_settings
ALTER TABLE business_settings 
  ADD COLUMN IF NOT EXISTS widget_enabled BOOLEAN DEFAULT true;

-- Update existing rows to have widget enabled by default
UPDATE business_settings 
SET widget_enabled = true 
WHERE widget_enabled IS NULL;

-- Add comment
COMMENT ON COLUMN business_settings.widget_enabled IS 
  'Controls whether the public quote widget is accessible for this business';
