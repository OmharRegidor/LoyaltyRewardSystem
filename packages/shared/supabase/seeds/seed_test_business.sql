-- Seed: Test Business for Subdomain Testing
--
-- INSTRUCTIONS:
-- 1. Find your user UUID from Supabase Dashboard → Authentication → Users
-- 2. Replace 'YOUR_USER_UUID_HERE' below with your actual UUID
-- 3. Run this in Supabase Dashboard → SQL Editor
--
-- Alternatively, uncomment the dynamic version at the bottom if you want to
-- automatically use the first user in auth.users (for dev only)

-- ============================================================================
-- OPTION 1: Manual - Replace with your actual user UUID
-- ============================================================================

-- INSERT INTO businesses (name, slug, owner_id, description, business_type)
-- VALUES (
--   'Binuk Bok Test Business',
--   'binukbok',
--   'YOUR_USER_UUID_HERE',  -- Replace this with your actual user UUID
--   'A test business for subdomain routing',
--   'restaurant'
-- )
-- ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- OPTION 2: Auto - Uses the first user from auth.users (DEV ONLY)
-- ============================================================================

-- First, check if a business with this slug already exists
DO $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Get the first user from auth.users
  SELECT id INTO v_owner_id FROM auth.users LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users. Please create a user first.';
  END IF;

  -- Insert the business if it doesn't exist
  INSERT INTO businesses (name, slug, owner_id, description, business_type)
  VALUES (
    'Binuk Bok Test Business',
    'binukbok',
    v_owner_id,
    'A test business for subdomain routing',
    'restaurant'
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

  RAISE NOTICE 'Business created/updated with slug: binukbok, owner_id: %', v_owner_id;
END $$;

-- ============================================================================
-- Verify the insert
-- ============================================================================

SELECT id, name, slug, owner_id, created_at
FROM businesses
WHERE slug = 'binukbok';
