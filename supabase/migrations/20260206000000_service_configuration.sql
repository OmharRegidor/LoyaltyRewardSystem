-- Migration: Service Configuration for Business-Type-Aware Forms
-- Adds flexible configuration columns to services table and creates
-- supporting tables for price variants and custom intake questions

-- ============================================
-- ADD COLUMNS TO SERVICES TABLE
-- ============================================

-- Flexible JSONB configuration per business type
ALTER TABLE services ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Service category (hair, nails, table, room, etc.)
ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Buffer time between bookings in minutes
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0;

-- Pricing type: fixed, per_hour, per_session, per_night, starting_at
ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'fixed'
  CHECK (pricing_type IN ('fixed', 'per_hour', 'per_session', 'per_night', 'starting_at'));

-- Required deposit percentage 0-100
ALTER TABLE services ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 0
  CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100);

-- Allow customers to select specific staff member
ALTER TABLE services ADD COLUMN IF NOT EXISTS allow_staff_selection BOOLEAN DEFAULT false;

-- Inventory count for hotels/accommodations (number of rooms/units)
ALTER TABLE services ADD COLUMN IF NOT EXISTS inventory_count INTEGER DEFAULT 1
  CHECK (inventory_count >= 1);

-- ============================================
-- CREATE SERVICE_PRICE_VARIANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_price_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price_centavos INTEGER NOT NULL DEFAULT 0 CHECK (price_centavos >= 0),
  description TEXT,
  capacity INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_service_price_variants_service_id ON service_price_variants(service_id);
CREATE INDEX IF NOT EXISTS idx_service_price_variants_active ON service_price_variants(service_id, is_active);

-- ============================================
-- CREATE SERVICE_QUESTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL DEFAULT 'text'
    CHECK (question_type IN ('text', 'select', 'checkbox', 'number')),
  options JSONB DEFAULT '[]'::jsonb, -- Array of option strings for select type
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_service_questions_service_id ON service_questions(service_id);

-- ============================================
-- ROW LEVEL SECURITY FOR SERVICE_PRICE_VARIANTS
-- ============================================

ALTER TABLE service_price_variants ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to service_price_variants"
  ON service_price_variants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Business owners can manage their service price variants
CREATE POLICY "Business owners can manage their service price variants"
  ON service_price_variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN businesses b ON b.id = s.business_id
      WHERE s.id = service_price_variants.service_id
      AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      JOIN businesses b ON b.id = s.business_id
      WHERE s.id = service_price_variants.service_id
      AND b.owner_id = auth.uid()
    )
  );

-- Staff can read price variants for their business
CREATE POLICY "Staff can read service price variants"
  ON service_price_variants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN staff st ON st.business_id = s.business_id
      WHERE s.id = service_price_variants.service_id
      AND st.user_id = auth.uid()
    )
  );

-- Public read access to active variants
CREATE POLICY "Public can read active service price variants"
  ON service_price_variants
  FOR SELECT
  TO anon
  USING (is_active = true);

-- ============================================
-- ROW LEVEL SECURITY FOR SERVICE_QUESTIONS
-- ============================================

ALTER TABLE service_questions ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to service_questions"
  ON service_questions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Business owners can manage their service questions
CREATE POLICY "Business owners can manage their service questions"
  ON service_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN businesses b ON b.id = s.business_id
      WHERE s.id = service_questions.service_id
      AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      JOIN businesses b ON b.id = s.business_id
      WHERE s.id = service_questions.service_id
      AND b.owner_id = auth.uid()
    )
  );

-- Staff can read questions for their business
CREATE POLICY "Staff can read service questions"
  ON service_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN staff st ON st.business_id = s.business_id
      WHERE s.id = service_questions.service_id
      AND st.user_id = auth.uid()
    )
  );

-- Public read access to questions
CREATE POLICY "Public can read service questions"
  ON service_questions
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_service_price_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_service_price_variants_updated_at ON service_price_variants;
CREATE TRIGGER trigger_service_price_variants_updated_at
  BEFORE UPDATE ON service_price_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_service_price_variants_updated_at();

CREATE OR REPLACE FUNCTION update_service_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_service_questions_updated_at ON service_questions;
CREATE TRIGGER trigger_service_questions_updated_at
  BEFORE UPDATE ON service_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_service_questions_updated_at();
