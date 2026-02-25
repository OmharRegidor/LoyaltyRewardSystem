-- Migration: Require first purchase before referral points are awarded
-- Instead of awarding referral points immediately, save as "pending" and
-- complete when the invitee makes their first purchase at the business.

-- ============================================
-- 1a. Add status column to referral_completions
-- ============================================

ALTER TABLE "public"."referral_completions"
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';

-- Backfill existing rows — they already received points
UPDATE "public"."referral_completions"
  SET "status" = 'completed'
  WHERE "status" = 'pending';

-- ============================================
-- 1b. Create claim_referral_code function
-- ============================================
-- Called by mobile app during onboarding. Saves the referral as pending
-- without awarding any points. Points are awarded later via trigger
-- when the invitee makes their first purchase.

CREATE OR REPLACE FUNCTION "public"."claim_referral_code"(
  "p_referral_code" TEXT,
  "p_invitee_customer_id" UUID
) RETURNS JSONB
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
  v_ref referral_codes%ROWTYPE;
  v_reward_points INT;
  v_existing UUID;
  v_business_name TEXT;
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

  -- 5. Get reward points and business name
  SELECT referral_reward_points, name INTO v_reward_points, v_business_name
  FROM businesses
  WHERE id = v_ref.business_id;

  IF v_reward_points IS NULL OR v_reward_points <= 0 THEN
    v_reward_points := 25;
  END IF;

  -- 6. Record completion as PENDING (no points awarded yet)
  INSERT INTO referral_completions (
    referral_code_id, referrer_customer_id, invitee_customer_id,
    business_id, referrer_points, invitee_points, status
  ) VALUES (
    v_ref.id, v_ref.customer_id, p_invitee_customer_id,
    v_ref.business_id, v_reward_points, v_reward_points, 'pending'
  );

  -- 7. Increment uses
  UPDATE referral_codes SET uses = uses + 1 WHERE id = v_ref.id;

  RETURN jsonb_build_object(
    'success', true,
    'pending', true,
    'referrer_points', v_reward_points,
    'invitee_points', v_reward_points,
    'business_id', v_ref.business_id,
    'business_name', v_business_name
  );
END;
$$;

-- ============================================
-- 1c. Trigger function: complete pending referrals on first purchase
-- ============================================

CREATE OR REPLACE FUNCTION "public"."trg_complete_pending_referrals"()
RETURNS TRIGGER
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
  v_pending RECORD;
BEGIN
  -- Only fire on real purchases (earn transactions with amount_spent)
  IF NEW.type != 'earn' OR NEW.amount_spent IS NULL OR NEW.amount_spent <= 0 THEN
    RETURN NEW;
  END IF;

  -- Find all pending referral completions for this customer + business
  FOR v_pending IN
    SELECT id, referrer_customer_id, invitee_customer_id,
           business_id, referrer_points, invitee_points
    FROM referral_completions
    WHERE invitee_customer_id = NEW.customer_id
      AND business_id = NEW.business_id
      AND status = 'pending'
  LOOP
    -- Award points to referrer
    INSERT INTO transactions (customer_id, business_id, type, points, description)
    VALUES (v_pending.referrer_customer_id, v_pending.business_id, 'earn',
            v_pending.referrer_points, 'Referral bonus - invited a friend');

    UPDATE customers SET
      total_points = total_points + v_pending.referrer_points,
      lifetime_points = lifetime_points + v_pending.referrer_points
    WHERE id = v_pending.referrer_customer_id;

    -- Award points to invitee
    INSERT INTO transactions (customer_id, business_id, type, points, description)
    VALUES (v_pending.invitee_customer_id, v_pending.business_id, 'earn',
            v_pending.invitee_points, 'Welcome bonus - joined via referral');

    UPDATE customers SET
      total_points = total_points + v_pending.invitee_points,
      lifetime_points = lifetime_points + v_pending.invitee_points
    WHERE id = v_pending.invitee_customer_id;

    -- Mark referral as completed
    UPDATE referral_completions
    SET status = 'completed', completed_at = NOW()
    WHERE id = v_pending.id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============================================
-- 1d. Create trigger
-- ============================================

CREATE TRIGGER trg_complete_pending_referrals
  AFTER INSERT ON "public"."transactions"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."trg_complete_pending_referrals"();
