-- ============================================
-- 1a. RPC: link_oauth_to_customer_by_phone
-- Matches customer by phone where user_id IS NULL,
-- sets user_id on the found record.
-- Returns the customer ID or null.
-- ============================================

CREATE OR REPLACE FUNCTION public.link_oauth_to_customer_by_phone(
  p_user_id UUID,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Find customer by phone that has no user_id linked
  SELECT id INTO v_customer_id
  FROM customers
  WHERE phone = p_phone
    AND user_id IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Link the OAuth user to this customer
  UPDATE customers
  SET user_id = p_user_id
  WHERE id = v_customer_id
    AND user_id IS NULL;

  RETURN v_customer_id;
END;
$$;

-- ============================================
-- 1b. Trigger: auto-populate customer_businesses
-- on every new transaction
-- ============================================

CREATE OR REPLACE FUNCTION public.trg_auto_link_customer_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO customer_businesses (customer_id, business_id)
  VALUES (NEW.customer_id, NEW.business_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS trg_auto_link_customer_business ON transactions;

CREATE TRIGGER trg_auto_link_customer_business
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_auto_link_customer_business();

-- ============================================
-- 1c. Backfill customer_businesses from existing data
-- ============================================

-- From transactions
INSERT INTO customer_businesses (customer_id, business_id)
SELECT DISTINCT customer_id, business_id
FROM transactions
WHERE customer_id IS NOT NULL
  AND business_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- From customers with created_by_business_id
INSERT INTO customer_businesses (customer_id, business_id)
SELECT id, created_by_business_id
FROM customers
WHERE created_by_business_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================
-- 1d. Dedup duplicate customers
-- Same email, one has user_id and one doesn't.
-- Merge orphan data into the linked record.
-- ============================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      linked.id AS linked_id,
      orphan.id AS orphan_id,
      linked.phone AS linked_phone,
      orphan.phone AS orphan_phone,
      linked.created_by_business_id AS linked_biz,
      orphan.created_by_business_id AS orphan_biz
    FROM customers AS linked
    JOIN customers AS orphan
      ON lower(linked.email) = lower(orphan.email)
      AND linked.id != orphan.id
      AND linked.user_id IS NOT NULL
      AND orphan.user_id IS NULL
  LOOP
    -- Move transactions from orphan to linked
    UPDATE transactions
    SET customer_id = rec.linked_id
    WHERE customer_id = rec.orphan_id;

    -- Move scan_logs from orphan to linked
    UPDATE scan_logs
    SET customer_id = rec.linked_id
    WHERE customer_id = rec.orphan_id;

    -- Move redemptions from orphan to linked
    UPDATE redemptions
    SET customer_id = rec.linked_id
    WHERE customer_id = rec.orphan_id;

    -- Move customer_businesses from orphan to linked
    INSERT INTO customer_businesses (customer_id, business_id)
    SELECT rec.linked_id, business_id
    FROM customer_businesses
    WHERE customer_id = rec.orphan_id
    ON CONFLICT DO NOTHING;

    DELETE FROM customer_businesses
    WHERE customer_id = rec.orphan_id;

    -- Copy phone and created_by_business_id if missing on linked
    UPDATE customers
    SET
      phone = COALESCE(customers.phone, rec.orphan_phone),
      created_by_business_id = COALESCE(customers.created_by_business_id, rec.orphan_biz)
    WHERE id = rec.linked_id;

    -- Delete orphan record
    DELETE FROM customers WHERE id = rec.orphan_id;
  END LOOP;
END;
$$;
