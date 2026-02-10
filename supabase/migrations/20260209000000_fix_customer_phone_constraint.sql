-- Fix: Allow same phone number across different businesses
-- Previously phone had a global unique constraint, meaning a customer
-- couldn't register at multiple businesses with the same phone number.
-- This migration replaces it with a composite unique index on (phone, created_by_business_id).

-- Remove global unique constraint on phone if it exists
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_phone_key;
DROP INDEX IF EXISTS customers_phone_key;
DROP INDEX IF EXISTS idx_customers_phone;

-- Add composite unique: same phone can exist across businesses, but not duplicated within one
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_business
  ON public.customers (phone, created_by_business_id)
  WHERE phone IS NOT NULL AND created_by_business_id IS NOT NULL;
