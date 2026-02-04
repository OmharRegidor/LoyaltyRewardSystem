-- Migration: Add RLS policies for public business page access
-- Allows anonymous and authenticated users to view active businesses, services, and rewards

-- ============================================
-- Enable RLS on tables (idempotent)
-- ============================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Public read policies for businesses
-- ============================================

-- Drop existing policy if exists (for idempotency)
DROP POLICY IF EXISTS "Public can view active businesses" ON businesses;

CREATE POLICY "Public can view active businesses" ON businesses
FOR SELECT TO anon, authenticated
USING (subscription_status IN ('active', 'trialing', 'free_forever'));

-- ============================================
-- Public read policies for services
-- ============================================

DROP POLICY IF EXISTS "Public can view active services" ON services;

CREATE POLICY "Public can view active services" ON services
FOR SELECT TO anon, authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = services.business_id
    AND subscription_status IN ('active', 'trialing', 'free_forever')
  )
);

-- ============================================
-- Public read policies for rewards
-- ============================================

DROP POLICY IF EXISTS "Public can view active rewards" ON rewards;

CREATE POLICY "Public can view active rewards" ON rewards
FOR SELECT TO anon, authenticated
USING (
  is_active = true
  AND is_visible = true
  AND (stock IS NULL OR stock > 0)
  AND EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = rewards.business_id
    AND subscription_status IN ('active', 'trialing', 'free_forever')
  )
);

-- ============================================
-- Public read policies for availability
-- ============================================

DROP POLICY IF EXISTS "Public can view business availability" ON availability;

CREATE POLICY "Public can view business availability" ON availability
FOR SELECT TO anon, authenticated
USING (
  branch_id IS NULL
  AND staff_id IS NULL
  AND EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = availability.business_id
    AND subscription_status IN ('active', 'trialing', 'free_forever')
  )
);

-- ============================================
-- Performance indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_services_active_business ON services(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_active_visible ON rewards(business_id, is_active, is_visible);
CREATE INDEX IF NOT EXISTS idx_availability_business_public ON availability(business_id) WHERE branch_id IS NULL AND staff_id IS NULL;
