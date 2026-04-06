-- Fix: resolve_customer_for_business references c.card_token which was dropped
-- in migration 20260404000000. Remove card_token from the function signature and body.

-- First drop the old function (signature change requires drop + recreate)
DROP FUNCTION IF EXISTS public.resolve_customer_for_business(text, uuid);

-- Recreate without card_token
CREATE OR REPLACE FUNCTION "public"."resolve_customer_for_business"("p_scanned_code" "text", "p_business_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "total_points" integer, "lifetime_points" integer, "tier" "text", "qr_code_url" "text", "full_name" "text", "email" "text", "created_by_business_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_full_url TEXT;
  v_scanned_customer RECORD;
  v_resolved_id UUID;
  v_new_qr_token TEXT;
BEGIN
  -- Build the full QR URL
  IF p_scanned_code LIKE 'NoxaLoyalty://%' THEN
    v_full_url := p_scanned_code;
  ELSE
    v_full_url := 'NoxaLoyalty://customer/' || p_scanned_code;
  END IF;

  -- Step 1: Find customer by QR code (exact match)
  SELECT c.id, c.user_id, c.email, c.full_name, c.phone,
         c.created_by_business_id
  INTO v_scanned_customer
  FROM customers c
  WHERE c.qr_code_url = v_full_url
  LIMIT 1;

  -- Fallback: UUID lookup (36-char check)
  IF v_scanned_customer.id IS NULL AND length(p_scanned_code) = 36 THEN
    SELECT c.id, c.user_id, c.email, c.full_name, c.phone,
           c.created_by_business_id
    INTO v_scanned_customer
    FROM customers c
    WHERE c.id = p_scanned_code::UUID
    LIMIT 1;
  END IF;

  -- Not found at all
  IF v_scanned_customer.id IS NULL THEN
    RETURN;
  END IF;

  -- Step 2: If customer belongs to this business (or has no business), return it
  IF v_scanned_customer.created_by_business_id IS NULL
     OR v_scanned_customer.created_by_business_id = p_business_id THEN
    RETURN QUERY
    SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
           c.tier, c.qr_code_url, c.full_name, c.email,
           c.created_by_business_id
    FROM customers c
    WHERE c.id = v_scanned_customer.id;
    RETURN;
  END IF;

  -- Step 3: Different business. Find matching record in this business.
  -- Try by user_id first (most reliable)
  IF v_scanned_customer.user_id IS NOT NULL THEN
    SELECT c.id INTO v_resolved_id
    FROM customers c
    WHERE c.user_id = v_scanned_customer.user_id
      AND c.created_by_business_id = p_business_id
    LIMIT 1;
  END IF;

  -- Try by email if no user_id match
  IF v_resolved_id IS NULL AND v_scanned_customer.email IS NOT NULL THEN
    SELECT c.id INTO v_resolved_id
    FROM customers c
    WHERE lower(c.email) = lower(v_scanned_customer.email)
      AND c.created_by_business_id = p_business_id
    LIMIT 1;
  END IF;

  -- Step 4: If found a matching record in this business, return it
  IF v_resolved_id IS NOT NULL THEN
    RETURN QUERY
    SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
           c.tier, c.qr_code_url, c.full_name, c.email,
           c.created_by_business_id
    FROM customers c
    WHERE c.id = v_resolved_id;
    RETURN;
  END IF;

  -- Step 5: No matching record in this business. Auto-create one.
  v_new_qr_token := replace(gen_random_uuid()::text, '-', '');

  INSERT INTO customers (
    user_id, email, full_name, phone,
    total_points, lifetime_points, tier,
    qr_code_url, created_by_business_id
  ) VALUES (
    v_scanned_customer.user_id,
    v_scanned_customer.email,
    v_scanned_customer.full_name,
    v_scanned_customer.phone,
    0, 0, 'bronze',
    'NoxaLoyalty://customer/' || v_new_qr_token,
    p_business_id
  )
  RETURNING customers.id INTO v_resolved_id;

  -- Link to business
  INSERT INTO customer_businesses (customer_id, business_id)
  VALUES (v_resolved_id, p_business_id)
  ON CONFLICT DO NOTHING;

  RETURN QUERY
  SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
         c.tier, c.qr_code_url, c.full_name, c.email,
         c.created_by_business_id
  FROM customers c
  WHERE c.id = v_resolved_id;
END;
$$;
