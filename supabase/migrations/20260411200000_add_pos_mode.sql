-- ============================================
-- Migration: Add pos_mode to businesses
-- Date: 2026-04-11
-- Description: Separate POS selling mode from business type.
--   pos_mode controls what POS shows (products/services/both).
--   business_type stays for display/directory only.
-- ============================================

-- Add pos_mode column
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS pos_mode TEXT DEFAULT NULL;

-- Add check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_pos_mode_check'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_pos_mode_check
      CHECK (pos_mode IS NULL OR pos_mode IN ('products', 'services', 'both'));
  END IF;
END $$;

-- Backfill from business_type for existing businesses that have POS enabled
UPDATE public.businesses
SET pos_mode = CASE
  WHEN business_type IN ('salon', 'barbershop', 'healthcare', 'hotel') THEN 'services'
  WHEN business_type IN ('retail', 'restaurant', 'rice_business') THEN 'products'
  ELSE 'both'
END
WHERE pos_mode IS NULL
  AND pos_onboarded = true;
