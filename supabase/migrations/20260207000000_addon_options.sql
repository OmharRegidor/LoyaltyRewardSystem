-- Migration: Add addon_options table for hotel activities with sub-options
-- Allows addons like "Diving Experience" to have options like "Fun Dive - ₱2,500"

-- ============================================
-- CREATE BOOKING_ADDON_OPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS booking_addon_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id UUID NOT NULL REFERENCES booking_addons(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price_centavos INTEGER NOT NULL DEFAULT 0 CHECK (price_centavos >= 0),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_booking_addon_options_addon_id ON booking_addon_options(addon_id);
CREATE INDEX IF NOT EXISTS idx_booking_addon_options_active ON booking_addon_options(addon_id, is_active);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE booking_addon_options ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to booking_addon_options"
  ON booking_addon_options
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Business owners can manage their addon options
CREATE POLICY "Business owners can manage their addon options"
  ON booking_addon_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM booking_addons a
      JOIN businesses b ON b.id = a.business_id
      WHERE a.id = booking_addon_options.addon_id
      AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM booking_addons a
      JOIN businesses b ON b.id = a.business_id
      WHERE a.id = booking_addon_options.addon_id
      AND b.owner_id = auth.uid()
    )
  );

-- Staff can read addon options for their business
CREATE POLICY "Staff can read addon options"
  ON booking_addon_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM booking_addons a
      JOIN staff st ON st.business_id = a.business_id
      WHERE a.id = booking_addon_options.addon_id
      AND st.user_id = auth.uid()
    )
  );

-- Public read access to active options
CREATE POLICY "Public can read active addon options"
  ON booking_addon_options
  FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================
-- UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_booking_addon_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_booking_addon_options_updated_at ON booking_addon_options;
CREATE TRIGGER trigger_booking_addon_options_updated_at
  BEFORE UPDATE ON booking_addon_options
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_addon_options_updated_at();

-- ============================================
-- ADD party_size AND variant_id TO BOOKINGS
-- ============================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS party_size INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES service_price_variants(id) ON DELETE SET NULL;
