-- ============================================
-- Migration: Milestone Rewards
-- Date: 2026-04-11
-- Description: Add milestone rewards to stamp cards.
--   Business owners can mark any stamp position as a
--   milestone with custom text. Card pauses at milestones
--   until staff redeems them, then continues.
-- ============================================

-- ============================================
-- 1. Add milestones column to stamp_card_templates
-- ============================================

ALTER TABLE public.stamp_card_templates
  ADD COLUMN IF NOT EXISTS milestones JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ============================================
-- 2. Add milestone tracking to stamp_cards
-- ============================================

ALTER TABLE public.stamp_cards
  ADD COLUMN IF NOT EXISTS milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS redeemed_milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS paused_at_milestone INTEGER DEFAULT NULL;

-- ============================================
-- 3. Update add_stamp to check milestones
-- ============================================

CREATE OR REPLACE FUNCTION public.add_stamp(
  p_customer_id UUID,
  p_business_id UUID,
  p_staff_id UUID,
  p_sale_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
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
BEGIN
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

  -- Get or create active (incomplete, non-redeemed) card
  SELECT * INTO v_card
    FROM stamp_cards
    WHERE customer_id = p_customer_id
      AND business_id = p_business_id
      AND is_completed = false
    ORDER BY created_at DESC
    LIMIT 1;

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

  -- Add stamp entry
  INSERT INTO stamp_entries (stamp_card_id, staff_id, sale_id, notes)
    VALUES (v_card.id, p_staff_id, p_sale_id, p_notes);

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
-- 4. New RPC: redeem_milestone
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
  -- Get the card
  SELECT * INTO v_card FROM stamp_cards WHERE id = p_stamp_card_id;

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
-- 5. Update undo_last_stamp to clear milestone pauses
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
  -- Get the card
  SELECT * INTO v_card FROM stamp_cards WHERE id = p_stamp_card_id;

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
-- 6. Update redeem_stamp_card to snapshot milestones on auto-restart
-- ============================================

CREATE OR REPLACE FUNCTION public.redeem_stamp_card(
  p_stamp_card_id UUID,
  p_staff_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_card RECORD;
  v_template RECORD;
  v_new_card_id UUID;
BEGIN
  SELECT * INTO v_card FROM stamp_cards WHERE id = p_stamp_card_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found');
  END IF;

  IF NOT v_card.is_completed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card is not complete');
  END IF;

  IF v_card.is_redeemed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card already redeemed');
  END IF;

  -- Mark card as redeemed
  UPDATE stamp_cards
    SET is_redeemed = true,
        redeemed_at = now()
    WHERE id = p_stamp_card_id;

  -- Check if auto-reset is enabled
  SELECT * INTO v_template
    FROM stamp_card_templates
    WHERE id = v_card.template_id;

  IF v_template.auto_reset AND v_template.is_active THEN
    -- Create a new card with fresh snapshot from current template (including milestones)
    INSERT INTO stamp_cards (
      customer_id, business_id, template_id,
      total_stamps, reward_title, milestones
    ) VALUES (
      v_card.customer_id, v_card.business_id, v_template.id,
      v_template.total_stamps, v_template.reward_title, v_template.milestones
    ) RETURNING id INTO v_new_card_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reward_title', v_card.reward_title,
    'new_card_id', v_new_card_id
  );
END;
$$;

-- ============================================
-- 7. Update get_customer_stamp_cards to include milestone data
-- ============================================

CREATE OR REPLACE FUNCTION public.get_customer_stamp_cards(
  p_customer_id UUID,
  p_business_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(card_data ORDER BY is_completed DESC, created_at DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      sc.id,
      sc.business_id,
      sc.stamps_collected,
      sc.total_stamps,
      sc.reward_title,
      sc.is_completed,
      sc.completed_at,
      sc.is_redeemed,
      sc.created_at,
      sc.milestones,
      sc.redeemed_milestones,
      sc.paused_at_milestone,
      b.name AS business_name,
      b.logo_url AS business_logo_url,
      b.loyalty_mode,
      sct.reward_image_url,
      sct.reward_description
    FROM stamp_cards sc
    JOIN businesses b ON b.id = sc.business_id
    JOIN stamp_card_templates sct ON sct.id = sc.template_id
    WHERE sc.customer_id = p_customer_id
      AND sc.is_redeemed = false
      AND (p_business_id IS NULL OR sc.business_id = p_business_id)
  ) card_data;

  RETURN v_result;
END;
$$;

-- ============================================
-- 8. Helper RPC: clear_invalid_milestone_pauses
--    Called by the API when milestones are updated
-- ============================================

CREATE OR REPLACE FUNCTION public.clear_invalid_milestone_pauses(
  p_template_id UUID,
  p_valid_positions INT[] DEFAULT '{}'
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE stamp_cards
    SET paused_at_milestone = NULL
    WHERE template_id = p_template_id
      AND is_completed = false
      AND is_redeemed = false
      AND paused_at_milestone IS NOT NULL
      AND (
        array_length(p_valid_positions, 1) IS NULL
        OR paused_at_milestone != ALL(p_valid_positions)
      );
END;
$$;
