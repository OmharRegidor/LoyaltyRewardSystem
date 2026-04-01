-- ============================================
-- Migration: Stamp Card Feature
-- Date: 2026-04-01
-- Description: Add digital stamp card as Enterprise feature
--   - Add loyalty_mode to businesses
--   - Create stamp_card_templates, stamp_cards, stamp_entries tables
--   - Create RPC functions for stamp operations
--   - Add RLS policies
--   - Enable realtime on stamp_cards
-- ============================================

-- ============================================
-- 1. Add loyalty_mode to businesses
-- ============================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS loyalty_mode TEXT NOT NULL DEFAULT 'points';

-- Add check constraint separately (IF NOT EXISTS not supported for constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_loyalty_mode_check'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_loyalty_mode_check
      CHECK (loyalty_mode IN ('points', 'stamps'));
  END IF;
END $$;

-- ============================================
-- 2. Create stamp_card_templates table
-- ============================================

CREATE TABLE IF NOT EXISTS public.stamp_card_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Loyalty Card',
  total_stamps INTEGER NOT NULL DEFAULT 10,
  reward_title TEXT NOT NULL,
  reward_description TEXT,
  reward_image_url TEXT,
  min_purchase_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  auto_reset BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT stamp_card_templates_total_stamps_range
    CHECK (total_stamps > 0 AND total_stamps <= 30)
);

-- One active template per business
CREATE UNIQUE INDEX IF NOT EXISTS idx_stamp_card_templates_active_business
  ON public.stamp_card_templates(business_id) WHERE (is_active = true);

CREATE INDEX IF NOT EXISTS idx_stamp_card_templates_business_id
  ON public.stamp_card_templates(business_id);

-- ============================================
-- 3. Create stamp_cards table
-- ============================================

CREATE TABLE IF NOT EXISTS public.stamp_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.stamp_card_templates(id) ON DELETE CASCADE,
  stamps_collected INTEGER NOT NULL DEFAULT 0,
  total_stamps INTEGER NOT NULL,
  reward_title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_redeemed BOOLEAN NOT NULL DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT stamp_cards_stamps_range
    CHECK (stamps_collected >= 0 AND stamps_collected <= total_stamps)
);

CREATE INDEX IF NOT EXISTS idx_stamp_cards_customer_business
  ON public.stamp_cards(customer_id, business_id);

CREATE INDEX IF NOT EXISTS idx_stamp_cards_business
  ON public.stamp_cards(business_id);

CREATE INDEX IF NOT EXISTS idx_stamp_cards_active
  ON public.stamp_cards(customer_id, business_id)
  WHERE (is_completed = false);

CREATE INDEX IF NOT EXISTS idx_stamp_cards_template
  ON public.stamp_cards(template_id);

-- ============================================
-- 4. Create stamp_entries table
-- ============================================

CREATE TABLE IF NOT EXISTS public.stamp_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stamp_card_id UUID NOT NULL REFERENCES public.stamp_cards(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  sale_id UUID,
  notes TEXT,
  is_undone BOOLEAN NOT NULL DEFAULT false,
  undone_at TIMESTAMPTZ,
  undone_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stamp_entries_card
  ON public.stamp_entries(stamp_card_id);

CREATE INDEX IF NOT EXISTS idx_stamp_entries_staff
  ON public.stamp_entries(staff_id);

-- ============================================
-- 5. RPC: add_stamp
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
      total_stamps, reward_title
    ) VALUES (
      p_customer_id, p_business_id, v_template.id,
      v_template.total_stamps, v_template.reward_title
    ) RETURNING * INTO v_card;
  END IF;

  -- Add stamp entry
  INSERT INTO stamp_entries (stamp_card_id, staff_id, sale_id, notes)
    VALUES (v_card.id, p_staff_id, p_sale_id, p_notes);

  -- Calculate new stamp count
  v_new_stamps := v_card.stamps_collected + 1;
  v_is_completed := v_new_stamps >= v_card.total_stamps;

  -- Update stamp card
  UPDATE stamp_cards
    SET stamps_collected = v_new_stamps,
        is_completed = v_is_completed,
        completed_at = CASE WHEN v_is_completed THEN now() ELSE NULL END
    WHERE id = v_card.id;

  -- Log scan for staff tracking
  INSERT INTO scan_logs (business_id, staff_id, customer_id, points_awarded, transaction_amount)
    VALUES (p_business_id, p_staff_id, p_customer_id, 0, 0);

  -- Update staff scan counters
  UPDATE staff
    SET scans_today = scans_today + 1,
        last_scan_at = now()
    WHERE id = p_staff_id;

  RETURN jsonb_build_object(
    'success', true,
    'card_id', v_card.id,
    'stamps_collected', v_new_stamps,
    'total_stamps', v_card.total_stamps,
    'is_completed', v_is_completed,
    'reward_title', v_card.reward_title
  );
END;
$$;

-- ============================================
-- 6. RPC: undo_last_stamp
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

  -- Decrement card count
  v_new_count := GREATEST(0, v_card.stamps_collected - 1);

  UPDATE stamp_cards
    SET stamps_collected = v_new_count,
        is_completed = false,
        completed_at = NULL
    WHERE id = p_stamp_card_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_count', v_new_count,
    'total_stamps', v_card.total_stamps
  );
END;
$$;

-- ============================================
-- 7. RPC: redeem_stamp_card
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
  -- Get the card
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
    -- Create a new card with fresh snapshot from current template
    INSERT INTO stamp_cards (
      customer_id, business_id, template_id,
      total_stamps, reward_title
    ) VALUES (
      v_card.customer_id, v_card.business_id, v_template.id,
      v_template.total_stamps, v_template.reward_title
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
-- 8. RPC: get_customer_stamp_cards
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
-- 9. RLS Policies
-- ============================================

-- stamp_card_templates
ALTER TABLE public.stamp_card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners manage own templates"
  ON public.stamp_card_templates
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read templates for their business"
  ON public.stamp_card_templates
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM staff WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Public can view active templates for active businesses"
  ON public.stamp_card_templates
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND business_id IN (
      SELECT id FROM businesses
      WHERE subscription_status IN ('active', 'trialing', 'free_forever')
    )
  );

-- stamp_cards
ALTER TABLE public.stamp_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own stamp cards"
  ON public.stamp_cards
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can read stamp cards for their business"
  ON public.stamp_cards
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM staff WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Business owners can read stamp cards"
  ON public.stamp_cards
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access stamp_cards"
  ON public.stamp_cards
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- stamp_entries
ALTER TABLE public.stamp_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stamp entries"
  ON public.stamp_entries
  FOR SELECT
  TO authenticated
  USING (
    stamp_card_id IN (
      SELECT id FROM stamp_cards
      WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
         OR business_id IN (SELECT business_id FROM staff WHERE user_id = auth.uid() AND is_active = true)
         OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Service role full access stamp_entries"
  ON public.stamp_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 10. Grant execute on functions
-- ============================================

GRANT EXECUTE ON FUNCTION public.add_stamp TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.undo_last_stamp TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_stamp_card TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_customer_stamp_cards TO authenticated, service_role;

-- ============================================
-- 11. Enable realtime on stamp_cards
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.stamp_cards;

-- ============================================
-- 12. Updated_at trigger for stamp_card_templates
-- ============================================

CREATE OR REPLACE FUNCTION public.update_stamp_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stamp_card_templates_updated_at
  BEFORE UPDATE ON public.stamp_card_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stamp_template_updated_at();
