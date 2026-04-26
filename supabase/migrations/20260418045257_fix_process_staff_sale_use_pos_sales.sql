-- The FK on sale_items.sale_id was previously switched to reference pos_sales,
-- but process_staff_sale was still inserting into the legacy sales table.
-- This caused "sale_items_sale_id_fkey" violations on every POS transaction.
-- Rewrite the RPC to insert into pos_sales with the full column set it tracks.

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
  p_sale_items JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  v_current_points INTEGER;
  v_staff_uuid UUID;
  v_staff_fk UUID;
BEGIN
  v_staff_uuid := p_staff_id::UUID;
  SELECT id INTO v_staff_fk FROM staff WHERE id = v_staff_uuid;

  SELECT pesos_per_point, min_purchase_for_points, max_points_per_transaction
  INTO v_pesos_per_point, v_min_purchase, v_max_points
  FROM businesses WHERE id = p_business_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business not found');
  END IF;

  IF v_pesos_per_point IS NULL OR v_pesos_per_point <= 0 THEN
    v_pesos_per_point := 10;
  END IF;

  IF p_exchange_points > 0 THEN
    SELECT COALESCE(cb.points, 0) INTO v_current_points
    FROM customer_businesses cb
    WHERE cb.customer_id = p_customer_id AND cb.business_id = p_business_id
    FOR UPDATE;

    IF v_current_points IS NULL OR v_current_points < p_exchange_points THEN
      RAISE EXCEPTION 'Insufficient points for exchange';
    END IF;

    v_exchange_centavos := p_exchange_points * v_pesos_per_point * 100;
    v_points_redeemed := p_exchange_points;
  END IF;

  v_total_centavos := GREATEST(p_subtotal_centavos - p_discount_centavos - v_exchange_centavos, 0);

  IF p_amount_tendered_centavos IS NOT NULL AND p_amount_tendered_centavos > v_total_centavos THEN
    v_change_centavos := p_amount_tendered_centavos - v_total_centavos;
  END IF;

  IF v_pesos_per_point > 0 AND p_tier_multiplier > 0 THEN
    DECLARE
      v_pointable_pesos NUMERIC;
    BEGIN
      v_pointable_pesos := (p_subtotal_centavos - p_discount_centavos)::NUMERIC / 100.0;

      IF v_min_purchase IS NOT NULL AND v_pointable_pesos < v_min_purchase THEN
        v_base_points := 0;
      ELSE
        v_base_points := FLOOR(v_pointable_pesos / v_pesos_per_point);
      END IF;

      v_points_earned := FLOOR(v_base_points * p_tier_multiplier);

      IF v_max_points IS NOT NULL AND v_max_points > 0 AND v_points_earned > v_max_points THEN
        v_points_earned := v_max_points;
      END IF;
    END;
  END IF;

  v_sale_number := generate_sale_number(p_business_id);

  -- Idempotency: if the same key already exists, return its result instead of double-charging
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_sale_id FROM pos_sales
    WHERE business_id = p_business_id AND idempotency_key = p_idempotency_key;
    IF v_sale_id IS NOT NULL THEN
      SELECT COALESCE(cb.points, 0) INTO v_new_balance
      FROM customer_businesses cb
      WHERE cb.customer_id = p_customer_id AND cb.business_id = p_business_id;
      RETURN jsonb_build_object(
        'sale_id', v_sale_id,
        'sale_number', (SELECT sale_number FROM pos_sales WHERE id = v_sale_id),
        'idempotent_replay', true,
        'new_points_balance', COALESCE(v_new_balance, 0)
      );
    END IF;
  END IF;

  INSERT INTO pos_sales (
    business_id, customer_id, staff_id, staff_name, sale_number,
    subtotal_centavos, discount_centavos, discount_type, discount_reason,
    exchange_points, exchange_discount_centavos,
    total_centavos, points_earned, points_redeemed,
    tier_multiplier, tier_name,
    amount_tendered_centavos, change_centavos, payment_method,
    idempotency_key, status
  ) VALUES (
    p_business_id, p_customer_id, v_staff_fk, p_staff_name, v_sale_number,
    p_subtotal_centavos, p_discount_centavos, p_discount_type, p_discount_reason,
    p_exchange_points, v_exchange_centavos,
    v_total_centavos, v_points_earned, v_points_redeemed,
    p_tier_multiplier, p_tier_name,
    p_amount_tendered_centavos, v_change_centavos, 'cash',
    p_idempotency_key, 'completed'
  )
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_sale_items)
  LOOP
    INSERT INTO sale_items (sale_id, product_id, name, description, quantity, unit_price_centavos, total_centavos)
    VALUES (
      v_sale_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != ''
           THEN (v_item->>'product_id')::UUID ELSE NULL END,
      v_item->>'name',
      v_item->>'description',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price_centavos')::INTEGER,
      (v_item->>'quantity')::INTEGER * (v_item->>'unit_price_centavos')::INTEGER
    );
  END LOOP;

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
            'POS Sale #' || v_sale_number, v_total_centavos::NUMERIC / 100.0);
  END IF;

  IF v_points_redeemed > 0 THEN
    UPDATE customers
    SET total_points = total_points - v_points_redeemed
    WHERE id = p_customer_id;

    UPDATE customer_businesses
    SET points = points - v_points_redeemed
    WHERE customer_id = p_customer_id AND business_id = p_business_id;

    INSERT INTO transactions (customer_id, business_id, type, points, description)
    VALUES (p_customer_id, p_business_id, 'redeem', v_points_redeemed,
            'Points Exchange on Sale #' || v_sale_number);
  END IF;

  SELECT COALESCE(cb.points, 0) INTO v_new_balance
  FROM customer_businesses cb
  WHERE cb.customer_id = p_customer_id AND cb.business_id = p_business_id;

  INSERT INTO scan_logs (business_id, staff_id, customer_id, points_awarded, transaction_amount)
  VALUES (p_business_id, v_staff_fk, p_customer_id, v_points_earned, v_total_centavos);

  IF v_staff_fk IS NOT NULL THEN
    UPDATE staff
    SET scans_today = COALESCE(scans_today, 0) + 1,
        points_awarded_today = COALESCE(points_awarded_today, 0) + v_points_earned,
        last_scan_at = NOW()
    WHERE id = v_staff_fk;
  END IF;

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'subtotal_centavos', p_subtotal_centavos,
    'discount_centavos', p_discount_centavos,
    'exchange_centavos', v_exchange_centavos,
    'total_centavos', v_total_centavos,
    'points_earned', v_points_earned,
    'points_redeemed', v_points_redeemed,
    'new_points_balance', COALESCE(v_new_balance, 0),
    'tier_multiplier', p_tier_multiplier,
    'base_points', v_base_points
  );
END;
$$;
