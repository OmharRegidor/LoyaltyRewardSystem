-- ============================================
-- Migration: Fix Race Conditions and Idempotency
-- Date: 2026-04-16
-- Description: Add FOR UPDATE row locking to stamp_cards selects
--   in add_stamp, undo_last_stamp, redeem_milestone, and
--   process_staff_sale to prevent race conditions under concurrent
--   requests. Also adds idempotency_key to stamp_entries so that
--   duplicate add_stamp calls with the same key are safely ignored.
-- ============================================

-- ============================================
-- 1. Add idempotency_key column to stamp_entries
-- ============================================

ALTER TABLE public.stamp_entries
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT DEFAULT NULL;

-- Unique partial index: only enforce uniqueness on non-null keys
CREATE UNIQUE INDEX IF NOT EXISTS stamp_entries_idempotency_key_unique
  ON public.stamp_entries (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ============================================
-- 2. Replace add_stamp with FOR UPDATE + idempotency
-- ============================================

CREATE OR REPLACE FUNCTION public.add_stamp(
  p_customer_id UUID,
  p_business_id UUID,
  p_staff_id UUID,
  p_sale_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_loyalty_mode TEXT;
  v_template RECORD;
  v_card RECORD;
  v_new_stamps INT;
  v_is_completed BOOLEAN;
  v_milestone_label TEXT;
  v_existing_entry RECORD;
BEGIN
  -- Idempotency check: if key already exists, return previous result
  IF p_idempotency_key IS NOT NULL THEN
    SELECT se.stamp_card_id, sc.stamps_collected, sc.total_stamps,
           sc.is_completed, sc.reward_title, sc.id AS card_id,
           sc.paused_at_milestone
    INTO v_existing_entry
    FROM stamp_entries se
    JOIN stamp_cards sc ON sc.id = se.stamp_card_id
    WHERE se.idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', true,
        'card_id', v_existing_entry.card_id,
        'stamps_collected', v_existing_entry.stamps_collected,
        'total_stamps', v_existing_entry.total_stamps,
        'is_completed', v_existing_entry.is_completed,
        'reward_title', v_existing_entry.reward_title
      );
    END IF;
  END IF;

  -- Verify business is in stamp mode
  SELECT loyalty_mode INTO v_loyalty_mode
    FROM businesses WHERE id = p_business_id;

  IF v_loyalty_mode IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business not found');
  END IF;

  IF v_loyalty_mode != 'stamps' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business uses points mode, not stamps');
  END IF;

  -- Get active template
  SELECT * INTO v_template
    FROM stamp_card_templates
    WHERE business_id = p_business_id AND is_active = true
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active stamp card template');
  END IF;

  -- Ensure customer_businesses link exists
  INSERT INTO customer_businesses (customer_id, business_id)
    VALUES (p_customer_id, p_business_id)
    ON CONFLICT DO NOTHING;

  -- Get or create active (incomplete, non-redeemed) card with FOR UPDATE lock
  SELECT * INTO v_card
    FROM stamp_cards
    WHERE customer_id = p_customer_id
      AND business_id = p_business_id
      AND is_completed = false
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

  IF NOT FOUND THEN
    -- Create new card with snapshot values from template
    INSERT INTO stamp_cards (
      customer_id, business_id, template_id,
      total_stamps, reward_title, milestones
    ) VALUES (
      p_customer_id, p_business_id, v_template.id,
      v_template.total_stamps, v_template.reward_title, v_template.milestones
    ) RETURNING * INTO v_card;
  END IF;

  -- Block stamps if card is paused at a milestone
  IF v_card.paused_at_milestone IS NOT NULL THEN
    SELECT m->>'label' INTO v_milestone_label
      FROM jsonb_array_elements(v_card.milestones) m
      WHERE (m->>'position')::int = v_card.paused_at_milestone
      LIMIT 1;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'Card paused at milestone. Redeem milestone reward first.',
      'is_milestone_paused', true,
      'milestone_position', v_card.paused_at_milestone,
      'milestone_label', COALESCE(v_milestone_label, 'Reward')
    );
  END IF;

  -- Add stamp entry (with optional idempotency_key)
  INSERT INTO stamp_entries (stamp_card_id, staff_id, sale_id, notes, idempotency_key)
    VALUES (v_card.id, p_staff_id, p_sale_id, p_notes, p_idempotency_key);

  -- Calculate new stamp count
  v_new_stamps := v_card.stamps_collected + 1;
  v_is_completed := v_new_stamps >= v_card.total_stamps;

  -- Check if new stamp count hits an unredeemed milestone
  SELECT m->>'label' INTO v_milestone_label
    FROM jsonb_array_elements(v_card.milestones) m
    WHERE (m->>'position')::int = v_new_stamps
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_card.redeemed_milestones) r
        WHERE (r->>'position')::int = v_new_stamps
      )
    LIMIT 1;

  IF v_milestone_label IS NOT NULL AND NOT v_is_completed THEN
    -- Pause card at this milestone
    UPDATE stamp_cards
      SET stamps_collected = v_new_stamps,
          paused_at_milestone = v_new_stamps
      WHERE id = v_card.id;

    -- Log scan for staff tracking
    INSERT INTO scan_logs (business_id, staff_id, customer_id, points_awarded, transaction_amount)
      VALUES (p_business_id, p_staff_id, p_customer_id, 0, 0);

    UPDATE staff
      SET scans_today = scans_today + 1, last_scan_at = now()
      WHERE id = p_staff_id;

    RETURN jsonb_build_object(
      'success', true,
      'card_id', v_card.id,
      'stamps_collected', v_new_stamps,
      'total_stamps', v_card.total_stamps,
      'is_completed', false,
      'is_milestone', true,
      'milestone_label', v_milestone_label,
      'milestone_position', v_new_stamps,
      'reward_title', v_card.reward_title
    );
  END IF;

  -- Normal stamp — update card
  UPDATE stamp_cards
    SET stamps_collected = v_new_stamps,
        is_completed = v_is_completed,
        completed_at = CASE WHEN v_is_completed THEN now() ELSE NULL END
    WHERE id = v_card.id;

  -- Log scan for staff tracking
  INSERT INTO scan_logs (business_id, staff_id, customer_id, points_awarded, transaction_amount)
    VALUES (p_business_id, p_staff_id, p_customer_id, 0, 0);

  UPDATE staff
    SET scans_today = scans_today + 1, last_scan_at = now()
    WHERE id = p_staff_id;

  RETURN jsonb_build_object(
    'success', true,
    'card_id', v_card.id,
    'stamps_collected', v_new_stamps,
    'total_stamps', v_card.total_stamps,
    'is_completed', v_is_completed,
    'is_milestone', false,
    'reward_title', v_card.reward_title
  );
END;
$$;

-- ============================================
-- 3. Replace undo_last_stamp with FOR UPDATE lock
-- ============================================

CREATE OR REPLACE FUNCTION public.undo_last_stamp(
  p_stamp_card_id UUID,
  p_staff_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_card RECORD;
  v_last_entry RECORD;
  v_new_count INT;
BEGIN
  -- Get the card with FOR UPDATE lock to prevent concurrent undo races
  SELECT * INTO v_card FROM stamp_cards WHERE id = p_stamp_card_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found');
  END IF;

  IF v_card.is_redeemed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot undo stamp on a redeemed card');
  END IF;

  -- Find last non-undone entry
  SELECT * INTO v_last_entry
    FROM stamp_entries
    WHERE stamp_card_id = p_stamp_card_id AND is_undone = false
    ORDER BY created_at DESC
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No stamps to undo');
  END IF;

  -- Mark entry as undone
  UPDATE stamp_entries
    SET is_undone = true,
        undone_at = now(),
        undone_by = p_staff_id
    WHERE id = v_last_entry.id;

  -- Decrement card count and always clear any milestone pause
  v_new_count := GREATEST(0, v_card.stamps_collected - 1);

  UPDATE stamp_cards
    SET stamps_collected = v_new_count,
        is_completed = false,
        completed_at = NULL,
        paused_at_milestone = NULL
    WHERE id = p_stamp_card_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_count', v_new_count,
    'total_stamps', v_card.total_stamps
  );
END;
$$;

-- ============================================
-- 4. Replace redeem_milestone with FOR UPDATE lock
-- ============================================

CREATE OR REPLACE FUNCTION public.redeem_milestone(
  p_stamp_card_id UUID,
  p_staff_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_card RECORD;
  v_milestone_label TEXT;
  v_position INT;
BEGIN
  -- Get the card with FOR UPDATE lock to prevent concurrent redemption races
  SELECT * INTO v_card FROM stamp_cards WHERE id = p_stamp_card_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found');
  END IF;

  IF v_card.paused_at_milestone IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card is not paused at a milestone');
  END IF;

  IF v_card.is_redeemed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card already redeemed');
  END IF;

  v_position := v_card.paused_at_milestone;

  -- Get milestone label
  SELECT m->>'label' INTO v_milestone_label
    FROM jsonb_array_elements(v_card.milestones) m
    WHERE (m->>'position')::int = v_position
    LIMIT 1;

  -- Append to redeemed_milestones and clear pause
  UPDATE stamp_cards
    SET paused_at_milestone = NULL,
        redeemed_milestones = redeemed_milestones || jsonb_build_array(
          jsonb_build_object(
            'position', v_position,
            'redeemed_at', now(),
            'redeemed_by', p_staff_id
          )
        )
    WHERE id = p_stamp_card_id;

  RETURN jsonb_build_object(
    'success', true,
    'milestone_label', COALESCE(v_milestone_label, 'Reward'),
    'milestone_position', v_position,
    'stamps_collected', v_card.stamps_collected,
    'total_stamps', v_card.total_stamps
  );
END;
$$;

-- ============================================
-- 5. Replace process_staff_sale with FOR UPDATE lock
--    on the customer_businesses points read
-- ============================================

-- Drop all overloads first (same pattern as the previous migration)
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
  v_current_points INTEGER;
  v_staff_uuid UUID;
  v_staff_fk UUID;
BEGIN
  -- Cast staff_id to UUID once for reuse
  v_staff_uuid := p_staff_id::UUID;

  -- Resolve FK-safe staff_id: NULL if the UUID isn't in the staff table (owner case)
  SELECT id INTO v_staff_fk FROM staff WHERE id = v_staff_uuid;

  -- Get business config
  SELECT pesos_per_point, min_purchase_for_points, max_points_per_transaction
  INTO v_pesos_per_point, v_min_purchase, v_max_points
  FROM businesses WHERE id = p_business_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business not found');
  END IF;

  -- Default pesos_per_point
  IF v_pesos_per_point IS NULL OR v_pesos_per_point <= 0 THEN
    v_pesos_per_point := 10;
  END IF;

  -- Calculate exchange value (points to pesos discount)
  IF p_exchange_points > 0 THEN
    -- FOR UPDATE locks the row to prevent concurrent point redemption races
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

  -- Calculate total
  v_total_centavos := GREATEST(p_subtotal_centavos - p_discount_centavos - v_exchange_centavos, 0);

  -- Calculate change
  IF p_amount_tendered_centavos IS NOT NULL AND p_amount_tendered_centavos > v_total_centavos THEN
    v_change_centavos := p_amount_tendered_centavos - v_total_centavos;
  END IF;

  -- Calculate points earned
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

  -- Generate sale number
  v_sale_number := generate_sale_number(p_business_id);

  -- Insert sale record (v_staff_fk is NULL when owner has no staff row)
  INSERT INTO sales (
    business_id, customer_id, staff_id, sale_number,
    subtotal_centavos, discount_centavos, discount_type, discount_reason,
    total_centavos, payment_method,
    amount_tendered_centavos, change_centavos,
    points_earned, points_redeemed,
    status
  ) VALUES (
    p_business_id, p_customer_id, v_staff_fk, v_sale_number,
    p_subtotal_centavos, p_discount_centavos, p_discount_type, p_discount_reason,
    v_total_centavos, 'cash',
    p_amount_tendered_centavos, v_change_centavos,
    v_points_earned, v_points_redeemed,
    'completed'
  )
  RETURNING id INTO v_sale_id;

  -- Insert sale items
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

  -- Award points to customer
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

  -- Handle point exchange (redemption)
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

  -- Get new balance
  SELECT COALESCE(cb.points, 0) INTO v_new_balance
  FROM customer_businesses cb
  WHERE cb.customer_id = p_customer_id AND cb.business_id = p_business_id;

  -- Record scan log (v_staff_fk is NULL when owner has no staff row)
  INSERT INTO scan_logs (business_id, staff_id, customer_id, points_awarded, transaction_amount)
  VALUES (p_business_id, v_staff_fk, p_customer_id, v_points_earned, v_total_centavos);

  -- Update staff counters only if staff record exists
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
$fn$;
