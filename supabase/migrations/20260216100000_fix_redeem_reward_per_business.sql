-- ============================================
-- Fix: Add per-business points check to redeem_reward
-- Prevents cross-business reward redemption
-- ============================================

CREATE OR REPLACE FUNCTION public.redeem_reward(p_customer_id UUID, p_reward_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_customer customers%ROWTYPE;
  v_reward rewards%ROWTYPE;
  v_redemption_code TEXT;
  v_redemption_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_biz_points INTEGER;
BEGIN
  -- 1. Validate customer
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Customer not found');
  END IF;

  -- 2. Validate reward
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;

  -- 3. Check validity period
  IF v_reward.valid_from IS NOT NULL AND NOW() < v_reward.valid_from THEN
    RETURN json_build_object('success', false, 'error', 'Reward is not yet available');
  END IF;
  IF v_reward.valid_until IS NOT NULL AND NOW() > v_reward.valid_until THEN
    RETURN json_build_object('success', false, 'error', 'Reward has expired');
  END IF;

  -- 4. Check stock
  IF v_reward.stock IS NOT NULL AND v_reward.stock != -1 AND v_reward.stock <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Reward is out of stock');
  END IF;

  -- 5. Check global points
  IF COALESCE(v_customer.total_points, 0) < v_reward.points_cost THEN
    RETURN json_build_object('success', false, 'error', 'Not enough points');
  END IF;

  -- 6. Check per-business points balance
  SELECT COALESCE(cb.points, 0) INTO v_biz_points
  FROM customer_businesses cb
  WHERE cb.customer_id = p_customer_id AND cb.business_id = v_reward.business_id;

  IF NOT FOUND OR v_biz_points < v_reward.points_cost THEN
    RETURN json_build_object('success', false, 'error', 'Not enough points at this business');
  END IF;

  -- 7. Generate redemption code
  v_redemption_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  v_expires_at := NOW() + INTERVAL '24 hours';
  v_redemption_id := gen_random_uuid();

  -- 8. Create redemption record
  INSERT INTO redemptions (id, customer_id, reward_id, business_id, points_used, redemption_code, expires_at, status)
  VALUES (v_redemption_id, p_customer_id, p_reward_id, v_reward.business_id, v_reward.points_cost, v_redemption_code, v_expires_at, 'pending');

  -- 9. Deduct global points
  UPDATE customers
  SET total_points = total_points - v_reward.points_cost
  WHERE id = p_customer_id;

  -- 10. Record transaction (triggers trg_auto_link_customer_business which deducts per-business points)
  INSERT INTO transactions (customer_id, business_id, reward_id, points, type, description)
  VALUES (p_customer_id, v_reward.business_id, p_reward_id, v_reward.points_cost, 'redeem', 'Redeemed: ' || v_reward.title);

  -- 11. Decrement stock if applicable
  IF v_reward.stock IS NOT NULL AND v_reward.stock != -1 THEN
    UPDATE rewards SET stock = stock - 1 WHERE id = p_reward_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'redemption_code', v_redemption_code,
    'points_used', v_reward.points_cost,
    'expires_at', v_expires_at
  );
END;
$$;
