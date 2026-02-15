-- Bypass RLS for customer QR lookup (staff scanning)
-- Uses SECURITY DEFINER to run as function owner, avoiding RLS restrictions
CREATE OR REPLACE FUNCTION lookup_customer_by_qr(p_scanned_code TEXT)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  total_points INTEGER,
  lifetime_points INTEGER,
  tier TEXT,
  qr_code_url TEXT,
  full_name TEXT,
  email TEXT,
  card_token TEXT,
  created_by_business_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_url TEXT;
BEGIN
  -- Build the full QR URL
  IF p_scanned_code LIKE 'NoxaLoyalty://%' THEN
    v_full_url := p_scanned_code;
  ELSE
    v_full_url := 'NoxaLoyalty://customer/' || p_scanned_code;
  END IF;

  -- Method 1: Exact match on qr_code_url
  RETURN QUERY
  SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
         c.tier, c.qr_code_url, c.full_name, c.email,
         c.card_token, c.created_by_business_id
  FROM customers c
  WHERE c.qr_code_url = v_full_url
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Method 2: UUID fallback (36-char check)
  IF length(p_scanned_code) = 36 THEN
    RETURN QUERY
    SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
           c.tier, c.qr_code_url, c.full_name, c.email,
           c.card_token, c.created_by_business_id
    FROM customers c
    WHERE c.id = p_scanned_code::UUID
    LIMIT 1;
  END IF;
END;
$$;
