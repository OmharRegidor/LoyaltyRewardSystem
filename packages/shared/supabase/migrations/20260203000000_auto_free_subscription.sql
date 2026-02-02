-- Migration: Auto-assign Free plan subscription on business creation
-- Ensures every business automatically gets the Free plan on signup

-- ============================================
-- 1. ADD INDEXES FOR HIGH TRAFFIC
-- ============================================

-- Index on business_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id
  ON subscriptions(business_id);

-- Partial index on active subscriptions only
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
  ON subscriptions(business_id)
  WHERE status = 'active';

-- ============================================
-- 2. ADD UNIQUE CONSTRAINT (one active subscription per business)
-- ============================================

-- Drop if exists first (idempotent)
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS unique_active_subscription_per_business;

-- Create unique partial index (PostgreSQL way to enforce conditional uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_subscription_per_business
  ON subscriptions(business_id)
  WHERE status = 'active';

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Business owners can read own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;

-- Policy: Business owners can read their own subscriptions
CREATE POLICY "Business owners can read own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Service role bypasses RLS by default, no explicit policy needed

-- ============================================
-- 4. TRIGGER FUNCTION: Auto-create Free subscription
-- ============================================

CREATE OR REPLACE FUNCTION create_free_subscription_for_business()
RETURNS TRIGGER AS $$
DECLARE
  v_free_plan_id UUID;
BEGIN
  -- Get the free plan ID
  SELECT id INTO v_free_plan_id
  FROM plans
  WHERE name = 'free' AND is_active = true
  LIMIT 1;

  -- Only create if free plan exists
  IF v_free_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (
      business_id,
      plan_id,
      status,
      billing_interval,
      is_free_forever,
      current_period_start
    ) VALUES (
      NEW.id,
      v_free_plan_id,
      'active',
      'monthly',
      true,
      now()
    )
    ON CONFLICT DO NOTHING; -- Prevent duplicates if trigger fires twice
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. ATTACH TRIGGER TO BUSINESSES TABLE
-- ============================================

-- Drop existing trigger if present (idempotent)
DROP TRIGGER IF EXISTS on_business_created_free_subscription ON businesses;

-- Create trigger
CREATE TRIGGER on_business_created_free_subscription
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription_for_business();

-- ============================================
-- 6. BACKFILL: Create free subscriptions for existing businesses
-- ============================================

-- Insert free subscriptions for businesses that don't have one
INSERT INTO subscriptions (
  business_id,
  plan_id,
  status,
  billing_interval,
  is_free_forever,
  current_period_start
)
SELECT
  b.id,
  p.id,
  'active',
  'monthly',
  true,
  COALESCE(b.created_at, now())
FROM businesses b
CROSS JOIN plans p
WHERE p.name = 'free'
  AND p.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.business_id = b.id
  );
