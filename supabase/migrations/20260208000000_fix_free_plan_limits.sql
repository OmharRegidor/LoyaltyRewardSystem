-- Migration: Fix free plan limits to match landing page
-- Landing page promises: Unlimited customers, 3 branches, 5 staff per branch

-- Update the free plan to have the correct limits
UPDATE plans
SET
  max_customers = NULL,         -- Unlimited
  max_branches = 3,             -- Up to 3 branches
  max_staff_per_branch = 5,     -- Up to 5 staff per branch
  has_loyalty = true,
  has_booking = false,
  has_pos = false,
  updated_at = now()
WHERE name = 'free';

-- Ensure enterprise plan has unlimited everything and all modules
UPDATE plans
SET
  max_customers = NULL,         -- Unlimited
  max_branches = NULL,          -- Unlimited
  max_staff_per_branch = NULL,  -- Unlimited
  has_loyalty = true,
  has_booking = true,
  has_pos = true,
  updated_at = now()
WHERE name = 'enterprise';

-- Delete any "core" plan that might still exist
DELETE FROM plans WHERE name = 'core';
