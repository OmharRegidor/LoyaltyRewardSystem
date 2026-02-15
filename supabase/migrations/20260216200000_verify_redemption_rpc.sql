-- ============================================
-- Fix: RLS blocking browser client from reading redemptions
-- Uses SECURITY DEFINER RPCs to bypass RLS (same pattern as lookup_customer_by_qr)
-- ============================================

-- 1. Verify a redemption code (case-insensitive)
CREATE OR REPLACE FUNCTION verify_redemption_code(p_code TEXT, p_business_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT
    r.id,
    r.redemption_code,
    r.points_used,
    r.status,
    r.expires_at,
    r.created_at,
    c.full_name AS customer_name,
    c.email AS customer_email,
    rw.title AS reward_title
  INTO v_rec
  FROM redemptions r
  LEFT JOIN customers c ON c.id = r.customer_id
  LEFT JOIN rewards rw ON rw.id = r.reward_id
  WHERE r.redemption_code ILIKE p_code
    AND r.business_id = p_business_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('found', false);
  END IF;

  RETURN json_build_object(
    'found', true,
    'id', v_rec.id,
    'redemption_code', v_rec.redemption_code,
    'points_used', v_rec.points_used,
    'status', v_rec.status,
    'expires_at', v_rec.expires_at,
    'created_at', v_rec.created_at,
    'customer_name', COALESCE(v_rec.customer_name, v_rec.customer_email, 'Customer'),
    'customer_email', v_rec.customer_email,
    'reward_title', COALESCE(v_rec.reward_title, 'Unknown Reward')
  );
END;
$$;

-- 2. Complete a pending redemption
CREATE OR REPLACE FUNCTION complete_redemption(p_redemption_id UUID, p_completed_by UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE redemptions
  SET status = 'completed',
      completed_at = NOW(),
      completed_by_user_id = p_completed_by
  WHERE id = p_redemption_id
    AND status = 'pending';

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN json_build_object('success', false);
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
