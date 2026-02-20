-- ============================================
-- RPC: verify_customer_otp
-- Validates a verification code, increments attempts,
-- and marks the customer as verified on success.
-- ============================================

CREATE OR REPLACE FUNCTION public.verify_customer_otp(
  p_code TEXT,
  p_email TEXT,
  p_business_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record verification_codes%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Find the most recent unexpired, unverified code for this email + business
  SELECT * INTO v_record
  FROM verification_codes
  WHERE email = LOWER(TRIM(p_email))
    AND business_id = p_business_id
    AND verified_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- No code found
  IF v_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_code_found',
      'message', 'No verification code found. Please request a new one.'
    );
  END IF;

  -- Max attempts exceeded
  IF v_record.attempts >= v_record.max_attempts THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'max_attempts',
      'message', 'Too many attempts. Please request a new code.'
    );
  END IF;

  -- Increment attempts
  UPDATE verification_codes
  SET attempts = attempts + 1
  WHERE id = v_record.id;

  -- Check code
  IF v_record.code != p_code THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Invalid verification code. Please try again.',
      'attempts_remaining', v_record.max_attempts - v_record.attempts - 1
    );
  END IF;

  -- Code is correct — mark as verified
  UPDATE verification_codes
  SET verified_at = NOW()
  WHERE id = v_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'verification_id', v_record.id,
    'purpose', v_record.purpose
  );
END;
$$;
