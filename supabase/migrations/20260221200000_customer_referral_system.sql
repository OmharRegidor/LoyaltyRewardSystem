-- ============================================
-- Customer Referral System
-- Per-business referral codes with anti-abuse
-- ============================================

-- 1. Referral codes table (one per customer-business pair)
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  uses INT NOT NULL DEFAULT 0,
  max_uses INT NOT NULL DEFAULT 20,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, business_id),
  UNIQUE (code)
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_customer ON referral_codes(customer_id);
CREATE INDEX idx_referral_codes_business ON referral_codes(business_id);

-- 2. Referral completions table (tracks each successful referral)
CREATE TABLE referral_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invitee_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  referrer_points INT NOT NULL,
  invitee_points INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (invitee_customer_id, business_id)
);

CREATE INDEX idx_referral_completions_referrer ON referral_completions(referrer_customer_id);
CREATE INDEX idx_referral_completions_business ON referral_completions(business_id);

-- 3. Add configurable reward points to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS referral_reward_points INT NOT NULL DEFAULT 25;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_completions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (implicit)
-- Customers can read their own codes
CREATE POLICY "Customers can read own referral codes" ON referral_codes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role manages referral codes" ON referral_codes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Completions: read access for authenticated users
CREATE POLICY "Authenticated can read referral completions" ON referral_completions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role manages referral completions" ON referral_completions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- RPC: Get or create referral code
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_referral_code(
  p_customer_id UUID,
  p_business_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_attempts INT := 0;
BEGIN
  -- Check if code already exists
  SELECT code INTO v_code
  FROM referral_codes
  WHERE customer_id = p_customer_id AND business_id = p_business_id AND is_active = true;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Generate unique 6-char alphanumeric code
  LOOP
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    v_attempts := v_attempts + 1;

    BEGIN
      INSERT INTO referral_codes (customer_id, business_id, code)
      VALUES (p_customer_id, p_business_id, v_code);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts >= 10 THEN
        RAISE EXCEPTION 'Failed to generate unique referral code after 10 attempts';
      END IF;
    END;
  END LOOP;
END;
$$;

-- ============================================
-- RPC: Complete referral
-- ============================================

CREATE OR REPLACE FUNCTION complete_referral(
  p_referral_code TEXT,
  p_invitee_customer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref referral_codes%ROWTYPE;
  v_reward_points INT;
  v_existing UUID;
BEGIN
  -- 1. Look up the referral code
  SELECT * INTO v_ref
  FROM referral_codes
  WHERE code = upper(p_referral_code) AND is_active = true;

  IF v_ref IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive referral code');
  END IF;

  -- 2. Self-referral check
  IF v_ref.customer_id = p_invitee_customer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
  END IF;

  -- 3. Duplicate invitee check (one referral per invitee per business)
  SELECT id INTO v_existing
  FROM referral_completions
  WHERE invitee_customer_id = p_invitee_customer_id AND business_id = v_ref.business_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already used a referral for this business');
  END IF;

  -- 4. Max uses check
  IF v_ref.uses >= v_ref.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral code has reached maximum uses');
  END IF;

  -- 5. Get reward points from business config
  SELECT referral_reward_points INTO v_reward_points
  FROM businesses
  WHERE id = v_ref.business_id;

  IF v_reward_points IS NULL OR v_reward_points <= 0 THEN
    v_reward_points := 25;
  END IF;

  -- 6. Insert transaction for referrer (earn)
  INSERT INTO transactions (customer_id, business_id, type, points, description)
  VALUES (v_ref.customer_id, v_ref.business_id, 'earn', v_reward_points, 'Referral bonus - invited a friend');

  -- 7. Insert transaction for invitee (earn)
  INSERT INTO transactions (customer_id, business_id, type, points, description)
  VALUES (p_invitee_customer_id, v_ref.business_id, 'earn', v_reward_points, 'Welcome bonus - joined via referral');

  -- 8. Update customer total_points and lifetime_points
  -- Note: customer_businesses.points is updated automatically by trg_auto_link_customer_business trigger on transaction insert
  UPDATE customers SET
    total_points = total_points + v_reward_points,
    lifetime_points = lifetime_points + v_reward_points
  WHERE id = v_ref.customer_id;

  UPDATE customers SET
    total_points = total_points + v_reward_points,
    lifetime_points = lifetime_points + v_reward_points
  WHERE id = p_invitee_customer_id;

  -- 9. Record completion
  INSERT INTO referral_completions (
    referral_code_id, referrer_customer_id, invitee_customer_id,
    business_id, referrer_points, invitee_points
  ) VALUES (
    v_ref.id, v_ref.customer_id, p_invitee_customer_id,
    v_ref.business_id, v_reward_points, v_reward_points
  );

  -- 10. Increment uses
  UPDATE referral_codes SET uses = uses + 1 WHERE id = v_ref.id;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_points', v_reward_points,
    'invitee_points', v_reward_points,
    'business_id', v_ref.business_id
  );
END;
$$;
