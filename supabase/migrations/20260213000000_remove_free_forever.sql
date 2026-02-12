-- Migration: Remove is_free_forever override
-- Safe because all businesses currently have subscription_status = 'active'

-- Safety: Move any businesses stuck on 'free_forever' status to 'active'
UPDATE businesses SET subscription_status = 'active' WHERE subscription_status = 'free_forever';

-- Clear is_free_forever flags
UPDATE businesses SET is_free_forever = false WHERE is_free_forever = true;
UPDATE subscriptions SET is_free_forever = false WHERE is_free_forever = true;

-- Recreate trigger WITHOUT is_free_forever
CREATE OR REPLACE FUNCTION create_free_subscription_for_business()
RETURNS TRIGGER AS $$
DECLARE v_free_plan_id UUID;
BEGIN
  SELECT id INTO v_free_plan_id FROM plans WHERE name = 'free' AND is_active = true LIMIT 1;
  IF v_free_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (business_id, plan_id, status, billing_interval, current_period_start)
    VALUES (NEW.id, v_free_plan_id, 'active', 'monthly', now())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies: remove 'free_forever' from status checks
DROP POLICY IF EXISTS "Public can view active businesses" ON businesses;
CREATE POLICY "Public can view active businesses" ON businesses
FOR SELECT TO anon, authenticated
USING (subscription_status IN ('active', 'trialing'));

DROP POLICY IF EXISTS "Public can view active services" ON services;
CREATE POLICY "Public can view active services" ON services
FOR SELECT TO anon, authenticated
USING (is_active = true AND EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = services.business_id
  AND subscription_status IN ('active', 'trialing')
));

DROP POLICY IF EXISTS "Public can view active rewards" ON rewards;
CREATE POLICY "Public can view active rewards" ON rewards
FOR SELECT TO anon, authenticated
USING (is_active = true AND is_visible = true AND (stock IS NULL OR stock > 0)
  AND EXISTS (
    SELECT 1 FROM businesses WHERE businesses.id = rewards.business_id
    AND subscription_status IN ('active', 'trialing')
));

DROP POLICY IF EXISTS "Public can view business availability" ON availability;
CREATE POLICY "Public can view business availability" ON availability
FOR SELECT TO anon, authenticated
USING (branch_id IS NULL AND staff_id IS NULL AND EXISTS (
  SELECT 1 FROM businesses WHERE businesses.id = availability.business_id
  AND subscription_status IN ('active', 'trialing')
));
