-- ============================================
-- Customer Verification & Business Join Codes
-- ============================================

-- 1. Add verification columns to customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_method TEXT;

-- 2. Backfill existing customers as verified
UPDATE customers
SET
  is_verified = true,
  verified_at = COALESCE(created_at, NOW()),
  verification_method = CASE
    WHEN user_id IS NOT NULL THEN 'oauth'
    ELSE 'legacy'
  END
WHERE is_verified = false;

-- 3. Add join_code to businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- 4. Auto-generate join codes for all existing businesses
UPDATE businesses
SET join_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT || id::TEXT), 1, 8))
WHERE join_code IS NULL;

-- 5. Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL DEFAULT 'signup',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_business
  ON verification_codes (email, business_id)
  WHERE verified_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_verification_codes_expires
  ON verification_codes (expires_at)
  WHERE verified_at IS NULL;

-- 6. RLS: service-role only access on verification_codes
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service role can access

-- 7. Cleanup function for expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour'
  RETURNING 1 INTO deleted_count;

  RETURN COALESCE(deleted_count, 0);
END;
$$;
