-- Add is_enabled column to capacity_options table
ALTER TABLE capacity_options 
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

-- Update existing rows to be enabled by default
UPDATE capacity_options 
SET is_enabled = true 
WHERE is_enabled IS NULL;

-- Add comment
COMMENT ON COLUMN capacity_options.is_enabled IS 
  'Whether this capacity option is visible in the public widget';

-- Create index for filtering enabled capacities
CREATE INDEX IF NOT EXISTS idx_capacity_options_enabled 
  ON capacity_options(is_enabled) WHERE is_enabled = true;
