-- ============================================
-- Migration: Increase max stamps from 30 to 50
-- Date: 2026-04-11
-- ============================================

-- Update stamp_card_templates constraint
ALTER TABLE public.stamp_card_templates
  DROP CONSTRAINT IF EXISTS stamp_card_templates_total_stamps_range;

ALTER TABLE public.stamp_card_templates
  ADD CONSTRAINT stamp_card_templates_total_stamps_range
  CHECK (total_stamps > 0 AND total_stamps <= 50);
