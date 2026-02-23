-- ============================================
-- RPC: link_oauth_to_customer
-- Matches customer by email where user_id IS NULL,
-- sets user_id on the found record.
-- Returns the customer ID or null.
--
-- This is the email counterpart to link_oauth_to_customer_by_phone.
-- Called by the mobile app when a user signs in with Google OAuth
-- to link their auth identity to a web-created customer record.
-- ============================================

CREATE OR REPLACE FUNCTION public.link_oauth_to_customer(
  p_user_id UUID,
  p_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Link ALL unlinked customers with matching email to this user.
  -- This covers the case where a user signed up at multiple businesses
  -- on web before ever signing into the mobile app.
  UPDATE customers
  SET user_id = p_user_id
  WHERE lower(email) = lower(p_email)
    AND user_id IS NULL
  RETURNING id INTO v_customer_id;

  -- v_customer_id will hold the last updated row's ID (or NULL if none matched)
  RETURN v_customer_id;
END;
$$;

-- ============================================
-- Trigger: auto-link new customers by email
-- When a customer is inserted with user_id = NULL,
-- check if another customer with the same email
-- already has a user_id, and copy it over.
--
-- This handles the case where a user is already
-- signed into the mobile app (has a linked customer),
-- then signs up at a second business via web.
-- ============================================

CREATE OR REPLACE FUNCTION public.trg_auto_link_customer_by_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_user_id UUID;
BEGIN
  -- Only act on new customers without a user_id but with an email
  IF NEW.user_id IS NOT NULL OR NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find an existing customer with the same email that is already linked
  SELECT user_id INTO v_existing_user_id
  FROM customers
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NOT NULL
    AND id != NEW.id
  LIMIT 1;

  -- If found, auto-link the new record to the same auth user
  IF v_existing_user_id IS NOT NULL THEN
    NEW.user_id := v_existing_user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_link_customer_by_email ON customers;

CREATE TRIGGER trg_auto_link_customer_by_email
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_auto_link_customer_by_email();

-- ============================================
-- RPC: resolve_customer_for_business
-- Smart QR lookup that resolves the correct
-- customer record for the scanning staff's business.
--
-- 1. Find customer by QR code (any business)
-- 2. If customer belongs to same business → return it
-- 3. If different business → find matching record in
--    this business by user_id or email
-- 4. If no match → auto-create a new customer record
--    for this business, copying data from the found one
-- ============================================

CREATE OR REPLACE FUNCTION public.resolve_customer_for_business(
  p_scanned_code TEXT,
  p_business_id UUID
)
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
           c.card_token, c.created_by_business_id
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
           c.card_token, c.created_by_business_id
    FROM customers c
    WHERE c.id = v_resolved_id;
    RETURN;
  END IF;

  -- Step 5: No matching record in this business. Auto-create one.
  v_new_qr_token := encode(gen_random_bytes(12), 'base64');

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
         c.card_token, c.created_by_business_id
  FROM customers c
  WHERE c.id = v_resolved_id;
END;
$$;
