-- Migration: Booking Add-ons System
-- This migration adds support for configurable booking add-ons

-- ============================================
-- CREATE BOOKING_ADDONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_centavos INTEGER NOT NULL CHECK (price_centavos >= 0),
  duration_minutes INTEGER, -- NULL if not time-based
  category VARCHAR(50), -- 'equipment', 'activity', 'amenity', etc.
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_booking_addons_business_id ON booking_addons(business_id);
CREATE INDEX idx_booking_addons_active ON booking_addons(business_id, is_active);

-- ============================================
-- CREATE BOOKING_ADDON_SELECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS booking_addon_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES booking_addons(id) ON DELETE RESTRICT,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price_centavos INTEGER NOT NULL, -- Price at time of booking
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_booking_addon_selections_booking_id ON booking_addon_selections(booking_id);
CREATE INDEX idx_booking_addon_selections_addon_id ON booking_addon_selections(addon_id);

-- ============================================
-- ADD COLUMNS TO BOOKINGS TABLE
-- ============================================

-- Add total_price_centavos to store the calculated total (service + addons * duration)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price_centavos INTEGER;

-- Add nights column for multi-night stays
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS nights INTEGER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addon_selections ENABLE ROW LEVEL SECURITY;

-- Booking addons policies
-- Allow service role full access
CREATE POLICY "Service role full access to booking_addons"
  ON booking_addons
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated business owners to manage their addons
CREATE POLICY "Business owners can manage their addons"
  ON booking_addons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = booking_addons.business_id
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = booking_addons.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Allow public read access to active addons
CREATE POLICY "Public can read active addons"
  ON booking_addons
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Booking addon selections policies
-- Allow service role full access
CREATE POLICY "Service role full access to booking_addon_selections"
  ON booking_addon_selections
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated business owners to view addon selections for their bookings
CREATE POLICY "Business owners can view their booking addon selections"
  ON booking_addon_selections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN businesses ON businesses.id = bookings.business_id
      WHERE bookings.id = booking_addon_selections.booking_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- ============================================
-- UPDATE TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_booking_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_booking_addons_updated_at
  BEFORE UPDATE ON booking_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_addons_updated_at();
