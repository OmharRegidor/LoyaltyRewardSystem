-- Migration: Booking System
-- Creates tables for services, staff-service assignments, availability, and bookings

-- ============================================================================
-- ENUM TYPE
-- ============================================================================

-- Booking status enum
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SERVICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  price_centavos integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT services_duration_positive CHECK (duration_minutes > 0),
  CONSTRAINT services_price_non_negative CHECK (price_centavos IS NULL OR price_centavos >= 0)
);

-- Indexes for services
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_branch_id ON services(branch_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active) WHERE is_active = true;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS services_updated_at ON services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STAFF_SERVICES TABLE (Junction table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT staff_services_unique UNIQUE (staff_id, service_id)
);

-- Indexes for staff_services
CREATE INDEX IF NOT EXISTS idx_staff_services_staff_id ON staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service_id ON staff_services(service_id);

-- ============================================================================
-- AVAILABILITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT availability_day_of_week_valid CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT availability_time_order CHECK (end_time > start_time)
);

-- Indexes for availability
CREATE INDEX IF NOT EXISTS idx_availability_business_id ON availability(business_id);
CREATE INDEX IF NOT EXISTS idx_availability_branch_id ON availability(branch_id);
CREATE INDEX IF NOT EXISTS idx_availability_staff_id ON availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_availability_day_of_week ON availability(day_of_week);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS availability_updated_at ON availability;
CREATE TRIGGER availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,

  -- Customer info (for non-registered customers)
  customer_name text,
  customer_email text,
  customer_phone text,

  -- Booking details
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes text,

  -- Cancellation info
  cancelled_at timestamptz,
  cancellation_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bookings_time_order CHECK (end_time > start_time),
  CONSTRAINT bookings_customer_info CHECK (
    customer_id IS NOT NULL OR
    (customer_name IS NOT NULL AND (customer_email IS NOT NULL OR customer_phone IS NOT NULL))
  )
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_branch_id ON bookings(branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id ON bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Composite index for common queries (upcoming bookings by business)
CREATE INDEX IF NOT EXISTS idx_bookings_business_date_status
  ON bookings(business_id, booking_date, status);

-- Composite index for staff schedule lookup
CREATE INDEX IF NOT EXISTS idx_bookings_staff_date
  ON bookings(staff_id, booking_date) WHERE staff_id IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Business owners can manage their services"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = services.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view their business services"
  ON services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = services.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );

CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  USING (is_active = true);

-- Staff_services policies
CREATE POLICY "Business owners can manage staff services"
  ON staff_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      JOIN businesses ON businesses.id = staff.business_id
      WHERE staff.id = staff_services.staff_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view their own service assignments"
  ON staff_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = staff_services.staff_id
      AND staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view staff service assignments"
  ON staff_services FOR SELECT
  USING (true);

-- Availability policies
CREATE POLICY "Business owners can manage availability"
  ON availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = availability.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage their own availability"
  ON availability FOR ALL
  USING (
    availability.staff_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = availability.staff_id
      AND staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view availability"
  ON availability FOR SELECT
  USING (is_available = true);

-- Bookings policies
CREATE POLICY "Business owners can manage all bookings"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view and update their assigned bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = bookings.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );

CREATE POLICY "Staff can update booking status"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = bookings.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );

CREATE POLICY "Customers can view their own bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = bookings.customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    customer_id IS NULL OR
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = bookings.customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can cancel their own bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = bookings.customer_id
      AND customers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Can only update status to cancelled
    status = 'cancelled'
  );
