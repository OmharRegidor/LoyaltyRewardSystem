-- ============================================
-- Migration: Add pos_onboarded + finish cleanup
-- Date: 2026-04-04
-- Description: Add pos_onboarded column to businesses,
--   and complete the cleanup that failed on trigger drops
-- ============================================

-- 1. Add pos_onboarded to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS pos_onboarded BOOLEAN NOT NULL DEFAULT false;

-- 2. Auto-set pos_onboarded for businesses that already have POS products
DO $$
BEGIN
  UPDATE public.businesses
    SET pos_onboarded = true
    WHERE id IN (
      SELECT DISTINCT business_id FROM public.products
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 3. Finish the cleanup items that failed in the previous migration
-- Drop triggers (wrapped to handle missing tables)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_booking_addon_options_updated_at ON public.booking_addon_options;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_booking_addons_updated_at ON public.booking_addons;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_set_booking_code ON public.bookings;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop booking tables
DROP TABLE IF EXISTS public.booking_addon_selections CASCADE;
DROP TABLE IF EXISTS public.booking_addon_options CASCADE;
DROP TABLE IF EXISTS public.booking_addons CASCADE;
DROP TABLE IF EXISTS public.service_addons CASCADE;
DROP TABLE IF EXISTS public.service_questions CASCADE;
DROP TABLE IF EXISTS public.service_price_variants CASCADE;
DROP TABLE IF EXISTS public.staff_services CASCADE;
DROP TABLE IF EXISTS public.availability CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;

-- Drop booking-related functions
DROP FUNCTION IF EXISTS public.set_booking_confirmation_code() CASCADE;
DROP FUNCTION IF EXISTS public.update_booking_addon_options_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_booking_addons_updated_at() CASCADE;

-- Drop booking enum
DROP TYPE IF EXISTS public.booking_status CASCADE;

-- Drop booking columns from plans/subscriptions
ALTER TABLE public.plans DROP COLUMN IF EXISTS has_booking;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS module_booking_override;

-- Drop Stripe columns
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_stripe_invoice_id_key;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_stripe_payment_intent_id_key;
DROP INDEX IF EXISTS public.idx_invoices_stripe_invoice;
DROP INDEX IF EXISTS public.idx_payments_stripe_payment_intent;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS stripe_invoice_id;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS stripe_invoice_number;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS stripe_hosted_invoice_url;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS stripe_invoice_pdf;
ALTER TABLE public.payments DROP COLUMN IF EXISTS stripe_payment_intent_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS stripe_invoice_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS stripe_charge_id;

-- Drop Xendit columns
ALTER TABLE public.businesses DROP COLUMN IF EXISTS xendit_customer_id;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS xendit_payment_method_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS xendit_subscription_id;
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS xendit_customer_id;

-- Drop card_token columns from customers
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_card_token_key;
DROP INDEX IF EXISTS public.idx_customers_card_token;
DROP POLICY IF EXISTS "Public can view customer by card token" ON public.customers;
ALTER TABLE public.customers DROP COLUMN IF EXISTS card_token;
ALTER TABLE public.customers DROP COLUMN IF EXISTS card_token_created_at;

-- Drop rate_limits table
DROP TABLE IF EXISTS public.rate_limits CASCADE;
DROP FUNCTION IF EXISTS public.check_rate_limit(TEXT, TEXT, TEXT, INT, INTERVAL) CASCADE;
