-- Migration: Public RLS Policies for Subdomain Access
-- Enables unauthenticated access for public business pages

-- ============================================================================
-- BUSINESSES TABLE
-- ============================================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their own business
DROP POLICY IF EXISTS "Business owners can manage their business" ON businesses;
CREATE POLICY "Business owners can manage their business"
  ON businesses FOR ALL
  USING (owner_id = auth.uid());

-- Public can view businesses (for subdomain lookup)
DROP POLICY IF EXISTS "Public can view businesses" ON businesses;
CREATE POLICY "Public can view businesses"
  ON businesses FOR SELECT
  USING (true);

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Customers can view and update their own record
DROP POLICY IF EXISTS "Customers can manage their own record" ON customers;
CREATE POLICY "Customers can manage their own record"
  ON customers FOR ALL
  USING (user_id = auth.uid());

-- Business owners can view customers created by their business
DROP POLICY IF EXISTS "Business owners can view their customers" ON customers;
CREATE POLICY "Business owners can view their customers"
  ON customers FOR SELECT
  USING (
    created_by_business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Staff can view customers for their business
DROP POLICY IF EXISTS "Staff can view business customers" ON customers;
CREATE POLICY "Staff can view business customers"
  ON customers FOR SELECT
  USING (
    created_by_business_id IN (
      SELECT business_id FROM staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Public can view customer by card_token (for loyalty card lookup)
DROP POLICY IF EXISTS "Public can view customer by card token" ON customers;
CREATE POLICY "Public can view customer by card token"
  ON customers FOR SELECT
  USING (card_token IS NOT NULL);

-- Public can create customers (for self-signup)
DROP POLICY IF EXISTS "Public can create customers" ON customers;
CREATE POLICY "Public can create customers"
  ON customers FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- CUSTOMER_BUSINESSES TABLE
-- ============================================================================

ALTER TABLE customer_businesses ENABLE ROW LEVEL SECURITY;

-- Business owners can view links to their business
DROP POLICY IF EXISTS "Business owners can view customer links" ON customer_businesses;
CREATE POLICY "Business owners can view customer links"
  ON customer_businesses FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Staff can view customer links for their business
DROP POLICY IF EXISTS "Staff can view customer links" ON customer_businesses;
CREATE POLICY "Staff can view customer links"
  ON customer_businesses FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Public can view customer-business links (for checking membership)
DROP POLICY IF EXISTS "Public can view customer business links" ON customer_businesses;
CREATE POLICY "Public can view customer business links"
  ON customer_businesses FOR SELECT
  USING (true);

-- Public can create customer-business links (for loyalty signup)
DROP POLICY IF EXISTS "Public can link customers to businesses" ON customer_businesses;
CREATE POLICY "Public can link customers to businesses"
  ON customer_businesses FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- REWARDS TABLE
-- ============================================================================

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their rewards
DROP POLICY IF EXISTS "Business owners can manage their rewards" ON rewards;
CREATE POLICY "Business owners can manage their rewards"
  ON rewards FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Staff can view their business rewards
DROP POLICY IF EXISTS "Staff can view business rewards" ON rewards;
CREATE POLICY "Staff can view business rewards"
  ON rewards FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Public can view active visible rewards
DROP POLICY IF EXISTS "Public can view active rewards" ON rewards;
CREATE POLICY "Public can view active rewards"
  ON rewards FOR SELECT
  USING (is_active = true AND is_visible = true);
