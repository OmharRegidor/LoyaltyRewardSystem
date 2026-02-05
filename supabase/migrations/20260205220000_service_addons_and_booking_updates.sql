-- Migration: Service Add-ons and Booking Updates
-- This migration adds service_addons table (add-ons linked to specific services)
-- and extends the bookings table with additional fields for the new booking modal

-- ============================================
-- CREATE SERVICE_ADDONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE, -- null = applies to all services
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_centavos INTEGER NOT NULL DEFAULT 0 CHECK (price_centavos >= 0),
  price_type VARCHAR(20) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'per_day', 'per_person')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_service_addons_business_id ON service_addons(business_id);
CREATE INDEX IF NOT EXISTS idx_service_addons_service_id ON service_addons(service_id);
CREATE INDEX IF NOT EXISTS idx_service_addons_active ON service_addons(business_id, is_active);

-- ============================================
-- ADD COLUMNS TO BOOKINGS TABLE
-- ============================================

-- End date for multi-day bookings (check-out date)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_date DATE;

-- Guest counts
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guests_adults INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guests_children INTEGER DEFAULT 0;

-- Addons stored as JSONB for flexibility (array of {addon_id, name, quantity, unit_price_centavos})
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS addons_json JSONB DEFAULT '[]'::jsonb;

-- Price breakdown
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS subtotal_centavos INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS addons_total_centavos INTEGER DEFAULT 0;

-- Special requests field
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- ============================================
-- ROW LEVEL SECURITY FOR SERVICE_ADDONS
-- ============================================

-- Enable RLS
ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to service_addons"
  ON service_addons
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated business owners to manage their service addons
CREATE POLICY "Business owners can manage their service addons"
  ON service_addons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = service_addons.business_id
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = service_addons.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Allow public read access to active service addons
CREATE POLICY "Public can read active service addons"
  ON service_addons
  FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================
-- UPDATE TRIGGER FOR SERVICE_ADDONS
-- ============================================

CREATE OR REPLACE FUNCTION update_service_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_service_addons_updated_at ON service_addons;
CREATE TRIGGER trigger_service_addons_updated_at
  BEFORE UPDATE ON service_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_service_addons_updated_at();

-- ============================================
-- ADD MAX_GUESTS TO SERVICES TABLE
-- ============================================

ALTER TABLE services ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 1;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_time_slot BOOLEAN DEFAULT true;
