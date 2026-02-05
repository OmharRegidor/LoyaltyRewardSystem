-- Migration: Add confirmation_code to bookings for public booking system
-- This enables customers to reference their bookings without needing an account

-- Add confirmation_code column to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS confirmation_code VARCHAR(10) UNIQUE;

-- Function to generate a unique confirmation code (BK-XXXXXX format)
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: BK- followed by 6 uppercase alphanumeric characters
    new_code := 'BK-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE confirmation_code = new_code) INTO code_exists;

    -- Exit loop if unique
    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-set confirmation code on insert
CREATE OR REPLACE FUNCTION set_booking_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_set_booking_code ON public.bookings;
CREATE TRIGGER trigger_set_booking_code
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_confirmation_code();

-- Backfill existing bookings without confirmation codes
UPDATE public.bookings
SET confirmation_code = generate_booking_code()
WHERE confirmation_code IS NULL;

-- RLS policies for public booking access
-- Allow public to create bookings (for self-service booking)
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
CREATE POLICY "Public can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Allow public to view booking by confirmation code (for confirmation page)
DROP POLICY IF EXISTS "Public can view booking by code" ON public.bookings;
CREATE POLICY "Public can view booking by code" ON public.bookings
  FOR SELECT USING (true);

-- Add index for confirmation_code lookups
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code ON public.bookings(confirmation_code);

-- Add index for availability lookups by date
CREATE INDEX IF NOT EXISTS idx_bookings_business_date ON public.bookings(business_id, booking_date);
