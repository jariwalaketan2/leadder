-- Add unique constraint to ensure one business per owner
-- First, let's check if there are any duplicate owner_ids
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT owner_id, COUNT(*) as cnt
    FROM public.businesses
    GROUP BY owner_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % users with multiple businesses. These need to be cleaned up before adding the constraint.', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicate businesses found. Safe to add constraint.';
  END IF;
END $$;

-- Add unique constraint on owner_id
-- This will fail if there are duplicates, which is intentional
ALTER TABLE public.businesses 
  ADD CONSTRAINT businesses_owner_id_unique UNIQUE (owner_id);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT businesses_owner_id_unique ON public.businesses IS 
  'Ensures each user can only own one business. Multi-business support can be added later if needed.';
