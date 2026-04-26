-- ============================================
-- Migration: Show item names in transaction description
-- Date: 2026-04-12
-- Description: Update process_staff_sale to store item names
--   in the transaction description instead of generic "POS Sale #..."
-- ============================================

-- We need to replace the function. Use the same DROP + CREATE pattern.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT oid, pg_get_function_identity_arguments(oid) AS args
    FROM pg_proc
    WHERE proname = 'process_staff_sale'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION public.process_staff_sale(%s)', r.args);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_staff_sale(
  p_business_id UUID,
  p_customer_id UUID,
  p_staff_id TEXT,
  p_staff_name TEXT,
  p_subtotal_centavos INTEGER,
  p_discount_centavos INTEGER DEFAULT 0,
  p_discount_type VARCHAR DEFAULT NULL,
  p_discount_reason VARCHAR DEFAULT NULL,
  p_exchange_points INTEGER DEFAULT 0,
  p_tier_multiplier NUMERIC DEFAULT 1.0,
  p_tier_name TEXT DEFAULT 'Bronze',
  p_amount_tendered_centavos INTEGER DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_sale_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_pesos_per_point INTEGER;
  v_min_purchase NUMERIC;
  v_max_points INTEGER;
  v_exchange_centavos INTEGER := 0;
  v_total_centavos INTEGER;
  v_base_points INTEGER := 0;
  v_points_earned INTEGER := 0;
  v_points_redeemed INTEGER := 0;
  v_new_balance INTEGER;
  v_sale_number VARCHAR(20);
  v_sale_id UUID;
  v_change_centavos INTEGER := 0;
  v_item JSONB;
  v_staff_uuid UUID;
  v_existing_sale_id UUID;
  v_tx_description TEXT;
BEGIN
  -- Check for duplicate submission
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_sale_id
    FROM pos_sales
    WHERE business_id = p_business_id AND idempotency_key = p_idempotency_key
    LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object('duplicate', true, 'sale_id', v_existing_sale_id);
    END IF;
  END IF;

  -- Resolve staff UUID (owners pass their user ID as text)
  BEGIN
    v_staff_uuid := p_staff_id::UUID;
  EXCEPTION WHEN others THEN
    v_staff_uuid := NULL;
  END;

  -- Fetch business loyalty settings
  SELECT pesos_per_point, min_purchase, max_points_per_transaction
  INTO v_pesos_per_point, v_min_purchase, v_max_points
  FROM businesses WHERE id = p_business_id;

  -- Calculate exchange discount
  IF p_exchange_points > 0 THEN
    v_exchange_centavos := p_exchange_points * COALESCE(v_pesos_per_point, 100) * 100;
  END IF;

  -- Calculate total
  v_total_centavos := GREATEST(0, p_subtotal_centavos - p_discount_centavos - v_exchange_centavos);

  -- Calculate change
  IF p_amount_tendered_centavos IS NOT NULL THEN
    v_change_centavos := GREATEST(0, p_amount_tendered_centavos - v_total_centavos);
  END IF;

  -- Calculate points
  IF p_customer_id IS NOT NULL AND v_pesos_per_point IS NOT NULL AND v_pesos_per_point > 0 THEN
    IF v_min_purchase IS NULL OR (v_total_centavos::NUMERIC / 100.0) >= v_min_purchase THEN
      v_base_points := FLOOR(v_total_centavos::NUMERIC / 100.0 / v_pesos_per_point);
      v_points_earned := FLOOR(v_base_points * COALESCE(p_tier_multiplier, 1.0));
      IF v_max_points IS NOT NULL AND v_max_points > 0 THEN
        v_points_earned := LEAST(v_points_earned, v_max_points);
      END IF;
    END IF;
  END IF;

  -- Generate sale number
  v_sale_number := to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(
    (SELECT COALESCE(MAX(SUBSTRING(sale_number FROM '-(.*)$')::INTEGER), 0) + 1
     FROM pos_sales
     WHERE business_id = p_business_id
       AND created_at::DATE = CURRENT_DATE)::TEXT,
    4, '0'
  );

  -- Insert sale
  INSERT INTO pos_sales (
    business_id, customer_id, staff_id, staff_name, sale_number,
    subtotal_centavos, discount_centavos, discount_type, discount_reason,
    exchange_points, exchange_discount_centavos, total_centavos,
    points_earned, tier_multiplier, tier_name,
    amount_tendered_centavos, change_centavos,
    payment_method, idempotency_key
  ) VALUES (
    p_business_id, p_customer_id, v_staff_uuid, p_staff_name, v_sale_number,
    p_subtotal_centavos, p_discount_centavos, p_discount_type, p_discount_reason,
    p_exchange_points, v_exchange_centavos, v_total_centavos,
    v_points_earned, p_tier_multiplier, p_tier_name,
    p_amount_tendered_centavos, v_change_centavos,
    'cash', p_idempotency_key
  ) RETURNING id INTO v_sale_id;

  -- Insert sale items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_sale_items)
  LOOP
    INSERT INTO sale_items (sale_id, product_id, name, description, quantity, unit_price_centavos, total_centavos)
    VALUES (
      v_sale_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != '' THEN (v_item->>'product_id')::UUID ELSE NULL END,
      v_item->>'name',
      v_item->>'description',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price_centavos')::INTEGER,
      (v_item->>'unit_price_centavos')::INTEGER * (v_item->>'quantity')::INTEGER
    );
  END LOOP;

  -- Build item names for transaction description
  SELECT string_agg(
    CASE WHEN (item->>'quantity')::INTEGER > 1
      THEN (item->>'name') || ' x' || (item->>'quantity')
      ELSE item->>'name'
    END, ', '
  ) INTO v_tx_description
  FROM jsonb_array_elements(p_sale_items) item;

  IF v_tx_description IS NULL OR v_tx_description = '' THEN
    v_tx_description := 'POS Sale #' || v_sale_number;
  END IF;

  -- Award points
  IF v_points_earned > 0 THEN
    UPDATE customers
    SET total_points = total_points + v_points_earned,
        lifetime_points = lifetime_points + v_points_earned,
        last_visit = NOW()
    WHERE id = p_customer_id;

    UPDATE customer_businesses
    SET points = points + v_points_earned
    WHERE customer_id = p_customer_id AND business_id = p_business_id;

    INSERT INTO transactions (customer_id, business_id, type, points, description, amount_spent)
    VALUES (p_customer_id, p_business_id, 'earn', v_points_earned,
            v_tx_description, v_total_centavos::NUMERIC / 100.0);
  END IF;

  -- Handle point exchange (redemption)
  IF v_points_redeemed > 0 THEN
    UPDATE customers
    SET total_points = total_points - v_points_redeemed
    WHERE id = p_customer_id;

    UPDATE customer_businesses
    SET points = points - v_points_redeemed
    WHERE customer_id = p_customer_id AND business_id = p_business_id;

    INSERT INTO transactions (customer_id, business_id, type, points, description, amount_spent)
    VALUES (p_customer_id, p_business_id, 'redeem', p_exchange_points,
            'Points exchange on sale #' || v_sale_number, v_exchange_centavos::NUMERIC / 100.0);
  END IF;

  -- Scan log
  INSERT INTO scan_logs (business_id, staff_id, customer_id, points_awarded, transaction_amount)
  VALUES (p_business_id, v_staff_uuid, p_customer_id, v_points_earned, v_total_centavos::NUMERIC / 100.0);

  -- Update staff scan counters
  IF v_staff_uuid IS NOT NULL THEN
    UPDATE staff
    SET scans_today = scans_today + 1, last_scan_at = NOW()
    WHERE id = v_staff_uuid;
  END IF;

  -- Ensure customer_businesses link exists
  INSERT INTO customer_businesses (customer_id, business_id)
  VALUES (p_customer_id, p_business_id)
  ON CONFLICT DO NOTHING;

  -- Return result
  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'subtotal_centavos', p_subtotal_centavos,
    'discount_centavos', p_discount_centavos,
    'exchange_points', p_exchange_points,
    'exchange_discount_centavos', v_exchange_centavos,
    'total_centavos', v_total_centavos,
    'points_earned', v_points_earned,
    'points_redeemed', v_points_redeemed,
    'change_centavos', v_change_centavos,
    'duplicate', false
  );
END;
$fn$;
