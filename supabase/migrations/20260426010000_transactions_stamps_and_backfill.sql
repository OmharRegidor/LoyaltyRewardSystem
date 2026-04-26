-- Make `transactions` a unified activity log so the customer mobile wallet
-- can show stamp-mode sales and quick stamps, not just points-mode sales.
--
-- Currently `process_staff_sale` only writes a transactions row when
-- points_earned > 0. In stamps mode the staff page passes skip_points=true,
-- so v_points_earned is always 0 and no transaction is written. Net effect:
-- a customer who visits a stamps-mode business sees nothing in their wallet.
--
-- Changes:
--  1. Add `sale_id` and `stamps_added` columns to `transactions`.
--  2. Backfill: insert missing rows for stamp-mode pos_sales, link existing
--     points-mode rows to their pos_sales, mark stamps_added for sale-linked
--     stamp_entries, insert standalone rows for quick stamps.
--  3. Rewrite `process_staff_sale` to always insert a transaction row, with
--     sale_id populated.
--  4. Rewrite `add_stamp` to update the matching transaction's stamps_added
--     when a sale_id is provided, or insert a standalone transaction for
--     quick stamps.
--
-- Depends on: 20260426000000_drop_old_add_stamp_overload.sql
-- (so add_stamp has a single, unambiguous signature before we replace it).

-- ============================================
-- 1. Schema additions
-- ============================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS sale_id UUID DEFAULT NULL
    REFERENCES public.pos_sales(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stamps_added INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_transactions_sale_id
  ON public.transactions(sale_id) WHERE sale_id IS NOT NULL;

-- ============================================
-- 2. Backfill existing data
-- ============================================

-- 2a. Link existing points-mode transactions to their pos_sales row.
-- Match on customer + business + points + same created_at (within 2s).
UPDATE public.transactions t
SET sale_id = ps.id
FROM public.pos_sales ps
WHERE t.sale_id IS NULL
  AND t.customer_id = ps.customer_id
  AND t.business_id = ps.business_id
  AND t.points = ps.points_earned
  AND ABS(EXTRACT(EPOCH FROM (t.created_at - ps.created_at))) < 2;

-- 2b. Insert transaction rows for pos_sales that have no matching row yet.
-- These are stamp-mode sales (points_earned = 0, no row was written).
-- Description uses concatenated item names, matching the new RPC behavior.
INSERT INTO public.transactions
  (customer_id, business_id, type, points, description, amount_spent, sale_id, stamps_added, created_at)
SELECT
  ps.customer_id,
  ps.business_id,
  'earn'::transaction_type,
  ps.points_earned,
  COALESCE(
    (SELECT string_agg(
        CASE WHEN si.quantity > 1
          THEN si.name || ' x' || si.quantity
          ELSE si.name
        END, ', ' ORDER BY si.created_at)
     FROM public.sale_items si WHERE si.sale_id = ps.id),
    'POS Sale #' || ps.sale_number
  ),
  ps.total_centavos::NUMERIC / 100.0,
  ps.id,
  0,
  ps.created_at
FROM public.pos_sales ps
WHERE ps.customer_id IS NOT NULL
  AND ps.status = 'completed'
  AND NOT EXISTS (SELECT 1 FROM public.transactions t WHERE t.sale_id = ps.id);

-- 2c. Mark stamps_added on transactions whose sale produced one or more stamps.
UPDATE public.transactions t
SET stamps_added = subq.cnt
FROM (
  SELECT se.sale_id, COUNT(*)::INTEGER AS cnt
  FROM public.stamp_entries se
  WHERE se.is_undone = false AND se.sale_id IS NOT NULL
  GROUP BY se.sale_id
) subq
WHERE t.sale_id = subq.sale_id
  AND t.stamps_added = 0;

-- 2d. Insert standalone transaction rows for quick stamps (no sale_id).
-- Skip any that already have a transaction within 2s of the stamp_entry
-- (avoids double-insert if a prior backfill or trigger already created one).
INSERT INTO public.transactions
  (customer_id, business_id, type, points, description, amount_spent, sale_id, stamps_added, created_at)
SELECT
  sc.customer_id,
  sc.business_id,
  'earn'::transaction_type,
  0,
  'Stamp earned',
  NULL,
  NULL,
  1,
  se.created_at
FROM public.stamp_entries se
JOIN public.stamp_cards sc ON sc.id = se.stamp_card_id
WHERE se.is_undone = false
  AND se.sale_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.customer_id = sc.customer_id
      AND t.business_id = sc.business_id
      AND t.stamps_added > 0
      AND ABS(EXTRACT(EPOCH FROM (t.created_at - se.created_at))) < 2
  );

-- ============================================
-- 3. Replace process_staff_sale: always insert a transaction row
-- ============================================

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
  v_tx_description TEXT;
  v_max_sale_centavos CONSTANT INTEGER := 1000000000;
  v_max_item_centavos CONSTANT INTEGER := 100000000;
  v_max_item_quantity CONSTANT INTEGER := 9999;
  v_item_qty INTEGER;
  v_item_unit INTEGER;
BEGIN
  IF p_subtotal_centavos IS NULL OR p_subtotal_centavos <= 0 THEN
    RAISE EXCEPTION 'Subtotal must be greater than 0' USING ERRCODE = 'check_violation';
  END IF;
  IF p_subtotal_centavos > v_max_sale_centavos THEN
    RAISE EXCEPTION 'Subtotal exceeds maximum allowed (₱%)', (v_max_sale_centavos / 100)
      USING ERRCODE = 'check_violation';
  END IF;
  IF p_discount_centavos IS NULL OR p_discount_centavos < 0 OR p_discount_centavos > p_subtotal_centavos THEN
    RAISE EXCEPTION 'Invalid discount amount' USING ERRCODE = 'check_violation';
  END IF;
  IF p_exchange_points IS NULL OR p_exchange_points < 0 THEN
    RAISE EXCEPTION 'Exchange points must be non-negative' USING ERRCODE = 'check_violation';
  END IF;
  IF p_tier_multiplier IS NULL OR p_tier_multiplier < 0 OR p_tier_multiplier > 10 THEN
    RAISE EXCEPTION 'Tier multiplier out of range' USING ERRCODE = 'check_violation';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_sale_items)
  LOOP
    v_item_qty := COALESCE((v_item->>'quantity')::INTEGER, 0);
    v_item_unit := COALESCE((v_item->>'unit_price_centavos')::INTEGER, 0);
    IF v_item_qty <= 0 OR v_item_qty > v_max_item_quantity THEN
      RAISE EXCEPTION 'Invalid item quantity: %', v_item_qty USING ERRCODE = 'check_violation';
    END IF;
    IF v_item_unit <= 0 OR v_item_unit > v_max_item_centavos THEN
      RAISE EXCEPTION 'Invalid item price' USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

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

  SELECT string_agg(
    CASE WHEN (item->>'quantity')::INTEGER > 1
      THEN (item->>'name') || ' x' || (item->>'quantity')
      ELSE item->>'name'
    END, ', '
  )
  INTO v_tx_description
  FROM jsonb_array_elements(p_sale_items) item
  WHERE COALESCE(item->>'name', '') <> '';

  IF v_tx_description IS NULL OR v_tx_description = '' THEN
    v_tx_description := 'POS Sale #' || v_sale_number;
  END IF;

  IF v_points_earned > 0 THEN
    UPDATE customers
    SET total_points = total_points + v_points_earned,
        lifetime_points = lifetime_points + v_points_earned,
        last_visit = NOW()
    WHERE id = p_customer_id;
  END IF;

  -- Always insert a transaction row, even when points_earned = 0 (stamps mode).
  -- The mobile wallet relies on this for activity history.
  INSERT INTO transactions (customer_id, business_id, type, points, description, amount_spent, sale_id)
  VALUES (
    p_customer_id, p_business_id, 'earn', v_points_earned,
    v_tx_description, v_total_centavos::NUMERIC / 100.0, v_sale_id
  );

  IF v_points_redeemed > 0 THEN
    UPDATE customers
    SET total_points = total_points - v_points_redeemed
    WHERE id = p_customer_id;

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
$fn$;

-- ============================================
-- 4. Replace add_stamp: link or create the wallet transaction
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
  v_tx_updated INT;
BEGIN
  -- Idempotency: replay returns the prior result without creating duplicates.
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

  SELECT loyalty_mode INTO v_loyalty_mode
    FROM businesses WHERE id = p_business_id;

  IF v_loyalty_mode IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business not found');
  END IF;

  IF v_loyalty_mode != 'stamps' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business uses points mode, not stamps');
  END IF;

  SELECT * INTO v_template
    FROM stamp_card_templates
    WHERE business_id = p_business_id AND is_active = true
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active stamp card template');
  END IF;

  INSERT INTO customer_businesses (customer_id, business_id)
    VALUES (p_customer_id, p_business_id)
    ON CONFLICT DO NOTHING;

  SELECT * INTO v_card
    FROM stamp_cards
    WHERE customer_id = p_customer_id
      AND business_id = p_business_id
      AND is_completed = false
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO stamp_cards (
      customer_id, business_id, template_id,
      total_stamps, reward_title, milestones
    ) VALUES (
      p_customer_id, p_business_id, v_template.id,
      v_template.total_stamps, v_template.reward_title, v_template.milestones
    ) RETURNING * INTO v_card;
  END IF;

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

  INSERT INTO stamp_entries (stamp_card_id, staff_id, sale_id, notes, idempotency_key)
    VALUES (v_card.id, p_staff_id, p_sale_id, p_notes, p_idempotency_key);

  v_new_stamps := v_card.stamps_collected + 1;
  v_is_completed := v_new_stamps >= v_card.total_stamps;

  -- Wallet activity log: when this stamp belongs to a sale, mark stamps_added
  -- on the sale's transaction row. Otherwise insert a standalone row so quick
  -- stamps still show up in the customer's wallet.
  IF p_sale_id IS NOT NULL THEN
    UPDATE transactions
      SET stamps_added = stamps_added + 1
      WHERE sale_id = p_sale_id;
    GET DIAGNOSTICS v_tx_updated = ROW_COUNT;
    -- If process_staff_sale somehow didn't write a row (shouldn't happen
    -- post-migration, but defensive), fall back to inserting one.
    IF v_tx_updated = 0 THEN
      INSERT INTO transactions
        (customer_id, business_id, type, points, description, amount_spent, sale_id, stamps_added)
      VALUES
        (p_customer_id, p_business_id, 'earn', 0,
         COALESCE(p_notes, 'Stamp earned'), NULL, p_sale_id, 1);
    END IF;
  ELSE
    INSERT INTO transactions
      (customer_id, business_id, type, points, description, amount_spent, sale_id, stamps_added)
    VALUES
      (p_customer_id, p_business_id, 'earn', 0, 'Stamp earned', NULL, NULL, 1);
  END IF;

  -- Milestone path: pause card and return early.
  SELECT m->>'label' INTO v_milestone_label
    FROM jsonb_array_elements(v_card.milestones) m
    WHERE (m->>'position')::int = v_new_stamps
      AND NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_card.redeemed_milestones) r
        WHERE (r->>'position')::int = v_new_stamps
      )
    LIMIT 1;

  IF v_milestone_label IS NOT NULL AND NOT v_is_completed THEN
    UPDATE stamp_cards
      SET stamps_collected = v_new_stamps,
          paused_at_milestone = v_new_stamps
      WHERE id = v_card.id;

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

  UPDATE stamp_cards
    SET stamps_collected = v_new_stamps,
        is_completed = v_is_completed,
        completed_at = CASE WHEN v_is_completed THEN now() ELSE NULL END
    WHERE id = v_card.id;

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
