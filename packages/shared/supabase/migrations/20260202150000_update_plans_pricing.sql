-- Migration: Update plans table for new pricing model
-- Free plan (unlimited loyalty features) and Enterprise plan (contact pricing)

-- Step 1: Alter price columns to be nullable (for "contact for pricing")
ALTER TABLE plans
  ALTER COLUMN price_monthly DROP NOT NULL,
  ALTER COLUMN price_annual DROP NOT NULL;

-- Step 2: Add feature flag columns for module access
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS has_loyalty boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_booking boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_pos boolean NOT NULL DEFAULT false;

-- Step 3: Update existing Core plan to Free plan
UPDATE plans
SET
  name = 'free',
  display_name = 'Free',
  description = 'Free plan with unlimited access to all loyalty features',
  price_monthly = 0,
  price_annual = 0,
  max_customers = NULL,         -- unlimited
  max_branches = NULL,          -- unlimited
  max_staff_per_branch = NULL,  -- unlimited
  has_loyalty = true,
  has_booking = false,
  has_pos = false,
  updated_at = now()
WHERE name = 'core' OR name = 'Core';

-- Step 4: Update Enterprise plan (contact for pricing)
UPDATE plans
SET
  display_name = 'Enterprise',
  description = 'Full-featured plan with Booking and POS systems',
  price_monthly = NULL,         -- contact for pricing
  price_annual = NULL,          -- contact for pricing
  max_customers = NULL,         -- unlimited
  max_branches = NULL,          -- unlimited
  max_staff_per_branch = NULL,  -- unlimited
  has_loyalty = true,
  has_booking = true,
  has_pos = true,
  updated_at = now()
WHERE name = 'enterprise' OR name = 'Enterprise';

-- Step 5: Insert Free plan if neither free nor core exists
INSERT INTO plans (name, display_name, description, price_monthly, price_annual, max_customers, max_branches, max_staff_per_branch, has_loyalty, has_booking, has_pos, is_active)
SELECT 'free', 'Free', 'Free plan with unlimited access to all loyalty features', 0, 0, NULL, NULL, NULL, true, false, false, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name IN ('free', 'core', 'Core'));

-- Step 6: Insert Enterprise plan if doesn't exist
INSERT INTO plans (name, display_name, description, price_monthly, price_annual, max_customers, max_branches, max_staff_per_branch, has_loyalty, has_booking, has_pos, is_active)
SELECT 'enterprise', 'Enterprise', 'Full-featured plan with Booking and POS systems', NULL, NULL, NULL, NULL, NULL, true, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name IN ('enterprise', 'Enterprise'));
