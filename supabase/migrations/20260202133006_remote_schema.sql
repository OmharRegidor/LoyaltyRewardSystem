


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'business_owner',
    'staff',
    'customer'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."billing_interval" AS ENUM (
    'monthly',
    'annual'
);


ALTER TYPE "public"."billing_interval" OWNER TO "postgres";


CREATE TYPE "public"."booking_status" AS ENUM (
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'no_show'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'open',
    'paid',
    'void',
    'uncollectible'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'succeeded',
    'failed',
    'refunded',
    'canceled'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."redemption_status" AS ENUM (
    'pending',
    'completed',
    'expired',
    'cancelled'
);


ALTER TYPE "public"."redemption_status" OWNER TO "postgres";


CREATE TYPE "public"."staff_role" AS ENUM (
    'owner',
    'manager',
    'cashier'
);


ALTER TYPE "public"."staff_role" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'preview',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'expired',
    'free_forever'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'earn',
    'redeem'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'business',
    'customer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_staff_invite"("p_token" "uuid", "p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invite RECORD;
  v_staff_id UUID;
  v_user_email TEXT;
  v_existing_staff UUID;
  v_role_text TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Get and lock the invite
  SELECT * INTO v_invite
  FROM public.staff_invites
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invite not found, already used, or expired');
  END IF;

  -- Check email match (case insensitive)
  IF LOWER(TRIM(v_invite.email)) != LOWER(TRIM(v_user_email)) THEN
    RETURN json_build_object(
      'success', false, 
      'error', format('Email mismatch. Invite is for %s but you are %s', v_invite.email, v_user_email)
    );
  END IF;

  -- Check if invite was already used
  IF EXISTS (SELECT 1 FROM public.staff WHERE invite_id = v_invite.id) THEN
    -- Already accepted, just return success
    SELECT id INTO v_existing_staff FROM public.staff WHERE invite_id = v_invite.id;
    RETURN json_build_object(
      'success', true, 
      'staff_id', v_existing_staff, 
      'business_id', v_invite.business_id, 
      'role', v_invite.role,
      'message', 'Already joined'
    );
  END IF;

  -- Check if user already staff for this business
  SELECT id INTO v_existing_staff
  FROM public.staff
  WHERE user_id = p_user_id AND business_id = v_invite.business_id;

  IF FOUND THEN
    -- Update invite status
    UPDATE public.staff_invites 
    SET status = 'accepted', accepted_at = NOW() 
    WHERE id = v_invite.id;
    
    RETURN json_build_object(
      'success', true, 
      'staff_id', v_existing_staff, 
      'business_id', v_invite.business_id, 
      'role', v_invite.role,
      'message', 'Already a team member'
    );
  END IF;

  -- Get role as text for casting
  v_role_text := v_invite.role;

  -- Create staff record (without foreign keys that cause issues)
  INSERT INTO public.staff (
    user_id,
    business_id,
    role,
    name,
    email,
    branch_name,
    invite_id,
    is_active,
    email_verified_at,
    created_at
  ) VALUES (
    p_user_id,
    v_invite.business_id,
    v_role_text::staff_role,
    v_invite.name,
    LOWER(TRIM(v_invite.email)),
    v_invite.branch_name,
    v_invite.id,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_staff_id;

  -- Mark invite as accepted
  UPDATE public.staff_invites 
  SET status = 'accepted', accepted_at = NOW() 
  WHERE id = v_invite.id;

  RETURN json_build_object(
    'success', true, 
    'staff_id', v_staff_id, 
    'business_id', v_invite.business_id, 
    'role', v_invite.role
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."accept_staff_invite"("p_token" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE customer_businesses SET points = points + p_points
  WHERE customer_id = p_customer_id AND business_id = p_business_id;
END;
$$;


ALTER FUNCTION "public"."add_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_customer_points"("p_customer_id" "uuid", "p_points" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE customers
  SET total_points = total_points + p_points,
      last_visit = NOW()
  WHERE id = p_customer_id;
END;
$$;


ALTER FUNCTION "public"."add_customer_points"("p_customer_id" "uuid", "p_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_plan_limit"("p_business_id" "uuid", "p_limit_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_plan plans%ROWTYPE;
  v_usage usage_tracking%ROWTYPE;
  v_current INTEGER;
  v_limit INTEGER;
  v_is_free BOOLEAN;
BEGIN
  -- Check if free forever (no limits)
  SELECT is_free_forever INTO v_is_free
  FROM businesses WHERE id = p_business_id;
  
  IF v_is_free = true THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'current', 0,
      'limit', NULL,
      'is_free', true
    );
  END IF;

  -- Get plan
  SELECT p.* INTO v_plan
  FROM plans p
  JOIN subscriptions s ON s.plan_id = p.id
  WHERE s.business_id = p_business_id;
  
  -- Get usage
  SELECT * INTO v_usage
  FROM usage_tracking
  WHERE business_id = p_business_id;
  
  -- Determine current and limit based on type
  CASE p_limit_type
    WHEN 'customers' THEN
      v_current := COALESCE(v_usage.customer_count, 0);
      v_limit := v_plan.max_customers;
    WHEN 'branches' THEN
      v_current := COALESCE(v_usage.branch_count, 0);
      v_limit := v_plan.max_branches;
    WHEN 'staff' THEN
      v_current := COALESCE(v_usage.staff_count, 0);
      v_limit := v_plan.max_staff_per_branch * COALESCE(v_plan.max_branches, 1);
    ELSE
      RETURN jsonb_build_object('error', 'Invalid limit type');
  END CASE;
  
  RETURN jsonb_build_object(
    'allowed', v_limit IS NULL OR v_current < v_limit,
    'current', v_current,
    'limit', v_limit,
    'is_free', false
  );
END;
$$;


ALTER FUNCTION "public"."check_plan_limit"("p_business_id" "uuid", "p_limit_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_identifier_type" "text", "p_action" "text", "p_max_requests" integer, "p_window_seconds" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_window_start timestamptz;
  v_request_count integer;
BEGIN
  -- Calculate window start time
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;

  -- Try to get existing rate limit record
  SELECT request_count, window_start
  INTO v_request_count, v_window_start
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND action = p_action;

  -- No existing record - create one and allow
  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (identifier, identifier_type, action, request_count, window_start)
    VALUES (p_identifier, p_identifier_type, p_action, 1, now());
    RETURN true;
  END IF;

  -- Check if window has expired - reset counter
  IF v_window_start < (now() - (p_window_seconds || ' seconds')::interval) THEN
    UPDATE public.rate_limits
    SET request_count = 1, window_start = now()
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND action = p_action;
    RETURN true;
  END IF;

  -- Check if within limit
  IF v_request_count < p_max_requests THEN
    UPDATE public.rate_limits
    SET request_count = request_count + 1
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND action = p_action;
    RETURN true;
  END IF;

  -- Rate limit exceeded
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_identifier_type" "text", "p_action" "text", "p_max_requests" integer, "p_window_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_subscription_access"("p_business_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_status subscription_status;
  v_is_free BOOLEAN;
BEGIN
  -- Check if free forever
  SELECT is_free_forever INTO v_is_free
  FROM businesses
  WHERE id = p_business_id;
  
  IF v_is_free = true THEN
    RETURN true;
  END IF;
  
  -- Check subscription status
  SELECT status INTO v_status
  FROM subscriptions
  WHERE business_id = p_business_id;
  
  RETURN v_status IN ('active', 'trialing', 'free_forever');
END;
$$;


ALTER FUNCTION "public"."check_subscription_access"("p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_subscription_limit"("p_business_id" "uuid", "p_limit_type" character varying) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_plan_limit INTEGER;
  v_current_count INTEGER;
  v_subscription RECORD;
BEGIN
  SELECT s.*, p.max_customers, p.max_branches, p.max_staff_per_branch INTO v_subscription
  FROM subscriptions s LEFT JOIN plans p ON s.plan_id = p.id
  WHERE s.business_id = p_business_id AND (s.status = 'active' OR s.is_free_forever = true);

  IF NOT FOUND THEN
    CASE p_limit_type
      WHEN 'customers' THEN v_plan_limit := 50;
      WHEN 'branches' THEN v_plan_limit := 1;
      WHEN 'staff' THEN v_plan_limit := 2;
      ELSE v_plan_limit := 0;
    END CASE;
  ELSE
    CASE p_limit_type
      WHEN 'customers' THEN v_plan_limit := v_subscription.max_customers;
      WHEN 'branches' THEN v_plan_limit := v_subscription.max_branches;
      WHEN 'staff' THEN v_plan_limit := v_subscription.max_staff_per_branch;
      ELSE v_plan_limit := 0;
    END CASE;
  END IF;

  IF v_plan_limit IS NULL THEN RETURN TRUE; END IF;

  CASE p_limit_type
    WHEN 'customers' THEN SELECT COUNT(*) INTO v_current_count FROM customers WHERE business_id = p_business_id;
    WHEN 'branches' THEN SELECT COUNT(*) INTO v_current_count FROM branches WHERE business_id = p_business_id;
    WHEN 'staff' THEN SELECT COUNT(*) INTO v_current_count FROM staff WHERE business_id = p_business_id;
    ELSE v_current_count := 0;
  END CASE;

  RETURN v_current_count < v_plan_limit;
END;
$$;


ALTER FUNCTION "public"."check_subscription_limit"("p_business_id" "uuid", "p_limit_type" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_verification_codes"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour'
  RETURNING 1 INTO deleted_count;

  RETURN COALESCE(deleted_count, 0);
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_verification_codes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_redemption"("p_redemption_id" "uuid", "p_completed_by" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE redemptions
  SET status = 'completed',
      completed_at = NOW(),
      completed_by_user_id = p_completed_by
  WHERE id = p_redemption_id
    AND status = 'pending';

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN json_build_object('success', false);
  END IF;

  RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."complete_redemption"("p_redemption_id" "uuid", "p_completed_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_referral"("p_referral_code" "text", "p_invitee_customer_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."complete_referral"("p_referral_code" "text", "p_invitee_customer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_free_subscription_for_business"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_free_plan_id UUID;
BEGIN
  SELECT id INTO v_free_plan_id FROM plans WHERE name = 'free' AND is_active = true LIMIT 1;
  IF v_free_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (business_id, plan_id, status, billing_interval, current_period_start)
    VALUES (NEW.id, v_free_plan_id, 'active', 'monthly', now())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_free_subscription_for_business"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrease_reward_stock"("p_reward_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.rewards
  SET stock = stock - 1
  WHERE id = p_reward_id AND stock > 0;
END;
$$;


ALTER FUNCTION "public"."decrease_reward_stock"("p_reward_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_usage"("p_business_id" "uuid", "p_column" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  EXECUTE format(
    'UPDATE usage_tracking SET %I = GREATEST(0, %I - 1), updated_at = NOW() WHERE business_id = $1',
    p_column, p_column
  ) USING p_business_id;
END;
$_$;


ALTER FUNCTION "public"."decrement_usage"("p_business_id" "uuid", "p_column" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE customer_businesses SET points = points - p_points
  WHERE customer_id = p_customer_id AND business_id = p_business_id AND points >= p_points;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient points at this business';
  END IF;
END;
$$;


ALTER FUNCTION "public"."deduct_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_customer_points"("p_customer_id" "uuid", "p_points" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.customers
  SET total_points = total_points - p_points
  WHERE id = p_customer_id AND total_points >= p_points;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;
END;
$$;


ALTER FUNCTION "public"."deduct_customer_points"("p_customer_id" "uuid", "p_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_or_create_customer_by_email"("p_email" "text", "p_full_name" "text", "p_phone" "text", "p_age" integer, "p_staff_id" "uuid", "p_business_id" "uuid") RETURNS TABLE("customer_id" "uuid", "is_new" boolean, "qr_code_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_customer_id UUID;
  v_is_new BOOLEAN := FALSE;
  v_qr_code_url TEXT;
  v_qr_token TEXT;
BEGIN
  -- Check if customer exists by email
  SELECT c.id, c.qr_code_url 
  INTO v_customer_id, v_qr_code_url
  FROM customers c
  WHERE LOWER(c.email) = LOWER(p_email)
  LIMIT 1;
  
  IF v_customer_id IS NULL THEN
    -- Generate unique QR token
    v_qr_token := encode(gen_random_bytes(12), 'base64');
    v_qr_token := replace(replace(replace(v_qr_token, '/', '_'), '+', '-'), '=', '');
    v_qr_code_url := 'loyaltyhub://customer/' || v_qr_token;
    
    -- Create new customer
    INSERT INTO customers (
      email,
      full_name,
      phone,
      total_points,
      lifetime_points,
      tier,
      qr_code_url,
      created_by_staff_id,
      created_by_business_id,
      created_at
    ) VALUES (
      LOWER(p_email),
      p_full_name,
      p_phone,
      0,
      0,
      'bronze',
      v_qr_code_url,
      p_staff_id,
      p_business_id,
      NOW()
    )
    RETURNING id, qr_code_url INTO v_customer_id, v_qr_code_url;
    
    v_is_new := TRUE;
  ELSE
    -- Update existing customer with any new info if provided
    UPDATE customers
    SET 
      full_name = COALESCE(p_full_name, full_name),
      phone = COALESCE(p_phone, phone)
    WHERE id = v_customer_id;
  END IF;
  
  RETURN QUERY SELECT v_customer_id, v_is_new, v_qr_code_url;
END;
$$;


ALTER FUNCTION "public"."find_or_create_customer_by_email"("p_email" "text", "p_full_name" "text", "p_phone" "text", "p_age" integer, "p_staff_id" "uuid", "p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_booking_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: BK- followed by 6 uppercase alphanumeric characters
    new_code := 'BK-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE confirmation_code = new_code) INTO code_exists;

    -- Exit loop if unique
    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_booking_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_business_slug"("business_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Lowercase, replace spaces with hyphens, remove special chars
  base_slug := LOWER(TRIM(business_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  base_slug := LEFT(base_slug, 100);

  final_slug := base_slug;

  -- If slug exists, append incrementing number
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := LEFT(base_slug, 96) || '-' || counter::TEXT;
  END LOOP;

  RETURN final_slug;
END;
$$;


ALTER FUNCTION "public"."generate_business_slug"("business_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_sale_number"("p_business_id" "uuid") RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_count INTEGER;
  v_date TEXT;
  v_number VARCHAR(20);
BEGIN
  -- Get today's date in YYYYMMDD format
  v_date := to_char(CURRENT_DATE, 'YYYYMMDD');

  -- Count today's sales for this business
  SELECT COUNT(*) + 1 INTO v_count
  FROM sales
  WHERE business_id = p_business_id
    AND DATE(created_at) = CURRENT_DATE;

  -- Format: YYYYMMDD-NNNN (e.g., 20260206-0001)
  v_number := v_date || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN v_number;
END;
$$;


ALTER FUNCTION "public"."generate_sale_number"("p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_slug"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'business';
  END IF;

  -- Check for uniqueness, add number if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;


ALTER FUNCTION "public"."generate_slug"("name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_business_activity_trend"("p_business_id" "uuid", "p_days" integer DEFAULT 30) RETURNS TABLE("day" "date", "transactions" bigint, "new_customers" bigint, "points_earned" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  WITH date_series AS (
    SELECT generate_series(
      (CURRENT_DATE - (p_days - 1) * INTERVAL '1 day')::date,
      CURRENT_DATE,
      '1 day'::interval
    )::date AS day
  ),
  daily_tx AS (
    SELECT
      t.created_at::date AS day,
      count(*) AS transactions,
      coalesce(sum(CASE WHEN t.type = 'earn' THEN t.points ELSE 0 END), 0) AS points_earned
    FROM transactions t
    WHERE t.business_id = p_business_id
      AND t.created_at >= CURRENT_DATE - p_days * INTERVAL '1 day'
    GROUP BY t.created_at::date
  ),
  daily_cust AS (
    SELECT
      cb.followed_at::date AS day,
      count(*) AS new_customers
    FROM customer_businesses cb
    WHERE cb.business_id = p_business_id
      AND cb.followed_at >= CURRENT_DATE - p_days * INTERVAL '1 day'
    GROUP BY cb.followed_at::date
  )
  SELECT
    ds.day,
    coalesce(dt.transactions, 0),
    coalesce(dc.new_customers, 0),
    coalesce(dt.points_earned, 0)
  FROM date_series ds
  LEFT JOIN daily_tx dt ON dt.day = ds.day
  LEFT JOIN daily_cust dc ON dc.day = ds.day
  ORDER BY ds.day;
$$;


ALTER FUNCTION "public"."get_business_activity_trend"("p_business_id" "uuid", "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_customer_tier"("p_lifetime_points" integer) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  IF p_lifetime_points >= 5000 THEN RETURN 'platinum';
  ELSIF p_lifetime_points >= 2000 THEN RETURN 'gold';
  ELSIF p_lifetime_points >= 500 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_customer_tier"("p_lifetime_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_invite_with_business"("p_token" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', si.id,
    'email', si.email,
    'name', si.name,
    'role', si.role,
    'branch_name', si.branch_name,
    'status', si.status,
    'expires_at', si.expires_at,
    'business_id', si.business_id,
    'business_name', b.name
  ) INTO v_result
  FROM public.staff_invites si
  JOIN public.businesses b ON b.id = si.business_id
  WHERE si.token = p_token;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_invite_with_business"("p_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_referral_code"("p_customer_id" "uuid", "p_business_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_or_create_referral_code"("p_customer_id" "uuid", "p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_staff_by_user"("p_user_id" "uuid", "p_business_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "business_id" "uuid", "role" "text", "name" "text", "email" "text", "is_active" boolean, "last_login" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.business_id,
    s.role::TEXT,
    s.name,
    s.email,
    s.is_active,
    s.last_login
  FROM public.staff s
  WHERE s.user_id = p_user_id AND s.business_id = p_business_id
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_staff_by_user"("p_user_id" "uuid", "p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_staff_today_stats"("p_staff_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'scans_today', COUNT(*),
    'points_awarded_today', COALESCE(SUM(points_awarded), 0)
  ) INTO v_result
  FROM public.scan_logs
  WHERE staff_id = p_staff_id
    AND scanned_at >= CURRENT_DATE;

  RETURN COALESCE(v_result, json_build_object('scans_today', 0, 'points_awarded_today', 0));
END;
$$;


ALTER FUNCTION "public"."get_staff_today_stats"("p_staff_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tier_multiplier"("p_tier" "text") RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  CASE p_tier
    WHEN 'platinum' THEN RETURN 2.0;
    WHEN 'gold' THEN RETURN 1.5;
    WHEN 'silver' THEN RETURN 1.25;
    ELSE RETURN 1.0;
  END CASE;
END;
$$;


ALTER FUNCTION "public"."get_tier_multiplier"("p_tier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("p_user_id" "uuid") RETURNS "public"."app_role"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role public.app_role;
BEGIN
  SELECT r.name INTO v_role
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = p_user_id;

  RETURN COALESCE(v_role, 'customer');
END;
$$;


ALTER FUNCTION "public"."get_user_role"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_staff_info"("p_user_id" "uuid") RETURNS TABLE("staff_id" "uuid", "business_id" "uuid", "business_name" "text", "role" "public"."staff_role", "is_active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as staff_id,
    s.business_id,
    b.name as business_name,
    s.role,
    s.is_active
  FROM public.staff s
  JOIN public.businesses b ON b.id = s.business_id
  WHERE s.user_id = p_user_id AND s.is_active = true
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_user_staff_info"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role_name public.app_role;
  v_role_id UUID;
BEGIN
  -- Read role from user metadata (set during signup)
  v_role_name := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'customer'
  );

  SELECT id INTO v_role_id FROM public.roles WHERE name = v_role_name;

  -- Fallback to customer if role not found
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'customer';
  END IF;

  INSERT INTO public.users (id, role_id, email)
  VALUES (NEW.id, v_role_id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_staff_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_staff_role_id UUID;
  v_current_role public.app_role;
BEGIN
  -- Only act on active staff with a user_id
  IF NEW.user_id IS NULL OR NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_staff_role_id FROM public.roles WHERE name = 'staff';

  -- Check current role (don't downgrade admin or business_owner)
  SELECT r.name INTO v_current_role
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = NEW.user_id;

  IF v_current_role IN ('admin', 'business_owner') THEN
    RETURN NEW;
  END IF;

  -- Upsert with staff role
  INSERT INTO public.users (id, role_id, email)
  VALUES (NEW.user_id, v_staff_role_id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    role_id = v_staff_role_id,
    updated_at = now();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_staff_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_users_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_usage"("p_business_id" "uuid", "p_column" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  EXECUTE format(
    'UPDATE usage_tracking SET %I = %I + 1, updated_at = NOW() WHERE business_id = $1',
    p_column, p_column
  ) USING p_business_id;
END;
$_$;


ALTER FUNCTION "public"."increment_usage"("p_business_id" "uuid", "p_column" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_staff_record"("p_user_id" "uuid", "p_business_id" "uuid", "p_role" "text", "p_name" "text", "p_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  INSERT INTO public.staff (user_id, business_id, role, name, email)
  VALUES (p_user_id, p_business_id, p_role::staff_role, p_name, p_email)
  RETURNING jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'business_id', business_id,
    'role', role,
    'name', name,
    'email', email,
    'is_active', is_active
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."insert_staff_record"("p_user_id" "uuid", "p_business_id" "uuid", "p_role" "text", "p_name" "text", "p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_oauth_to_customer"("p_user_id" "uuid", "p_email" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Link ALL unlinked customers with matching email to this user.
  -- This covers the case where a user signed up at multiple businesses
  -- on web before ever signing into the mobile app.
  UPDATE customers
  SET user_id = p_user_id
  WHERE lower(email) = lower(p_email)
    AND user_id IS NULL
  RETURNING id INTO v_customer_id;

  -- v_customer_id will hold the last updated row's ID (or NULL if none matched)
  RETURN v_customer_id;
END;
$$;


ALTER FUNCTION "public"."link_oauth_to_customer"("p_user_id" "uuid", "p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_oauth_to_customer_by_phone"("p_user_id" "uuid", "p_phone" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."link_oauth_to_customer_by_phone"("p_user_id" "uuid", "p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lookup_customer_by_qr"("p_scanned_code" "text") RETURNS TABLE("id" "uuid", "user_id" "uuid", "total_points" integer, "lifetime_points" integer, "tier" "text", "qr_code_url" "text", "full_name" "text", "email" "text", "card_token" "text", "created_by_business_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_full_url TEXT;
BEGIN
  -- Build the full QR URL
  IF p_scanned_code LIKE 'NoxaLoyalty://%' THEN
    v_full_url := p_scanned_code;
  ELSE
    v_full_url := 'NoxaLoyalty://customer/' || p_scanned_code;
  END IF;

  -- Method 1: Exact match on qr_code_url
  RETURN QUERY
  SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
         c.tier, c.qr_code_url, c.full_name, c.email,
         c.card_token, c.created_by_business_id
  FROM customers c
  WHERE c.qr_code_url = v_full_url
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  -- Method 2: UUID fallback (36-char check)
  IF length(p_scanned_code) = 36 THEN
    RETURN QUERY
    SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
           c.tier, c.qr_code_url, c.full_name, c.email,
           c.card_token, c.created_by_business_id
    FROM customers c
    WHERE c.id = p_scanned_code::UUID
    LIMIT 1;
  END IF;
END;
$$;


ALTER FUNCTION "public"."lookup_customer_by_qr"("p_scanned_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_usage_counts"("p_business_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE usage_tracking
  SET 
    customer_count = (
      SELECT COUNT(*) FROM customers 
      WHERE created_by_business_id = p_business_id
    ),
    branch_count = (
      SELECT COUNT(*) FROM branches 
      WHERE business_id = p_business_id AND is_active = true
    ),
    staff_count = (
      SELECT COUNT(*) FROM staff 
      WHERE business_id = p_business_id AND is_active = true
    ),
    updated_at = NOW()
  WHERE business_id = p_business_id;
END;
$$;


ALTER FUNCTION "public"."recalculate_usage_counts"("p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_customer_scan"("p_staff_id" "uuid", "p_customer_id" "uuid", "p_points" integer, "p_amount" numeric DEFAULT NULL::numeric) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_business_id UUID;
  v_scan_id UUID;
  v_staff_verified TIMESTAMPTZ;
BEGIN
  -- Get business and verify staff is active and verified
  SELECT business_id, email_verified_at INTO v_business_id, v_staff_verified
  FROM public.staff
  WHERE id = p_staff_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Staff not found or inactive');
  END IF;

  IF v_staff_verified IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Staff email not verified');
  END IF;

  -- Record the scan
  INSERT INTO public.scan_logs (business_id, staff_id, customer_id, points_awarded, transaction_amount)
  VALUES (v_business_id, p_staff_id, p_customer_id, p_points, p_amount)
  RETURNING id INTO v_scan_id;

  -- Update staff counters
  UPDATE public.staff
  SET 
    scans_today = COALESCE(scans_today, 0) + 1,
    points_awarded_today = COALESCE(points_awarded_today, 0) + p_points,
    last_scan_at = NOW()
  WHERE id = p_staff_id;

  RETURN json_build_object('success', true, 'scan_id', v_scan_id);
END;
$$;


ALTER FUNCTION "public"."record_customer_scan"("p_staff_id" "uuid", "p_customer_id" "uuid", "p_points" integer, "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_reward"("p_customer_id" "uuid", "p_reward_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."redeem_reward"("p_customer_id" "uuid", "p_reward_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_customer_for_business"("p_scanned_code" "text", "p_business_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "total_points" integer, "lifetime_points" integer, "tier" "text", "qr_code_url" "text", "full_name" "text", "email" "text", "card_token" "text", "created_by_business_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_full_url TEXT;
  v_scanned_customer RECORD;
  v_resolved_id UUID;
  v_new_qr_token TEXT;
BEGIN
  -- Build the full QR URL
  IF p_scanned_code LIKE 'NoxaLoyalty://%' THEN
    v_full_url := p_scanned_code;
  ELSE
    v_full_url := 'NoxaLoyalty://customer/' || p_scanned_code;
  END IF;

  -- Step 1: Find customer by QR code (exact match)
  SELECT c.id, c.user_id, c.email, c.full_name, c.phone,
         c.created_by_business_id
  INTO v_scanned_customer
  FROM customers c
  WHERE c.qr_code_url = v_full_url
  LIMIT 1;

  -- Fallback: UUID lookup (36-char check)
  IF v_scanned_customer.id IS NULL AND length(p_scanned_code) = 36 THEN
    SELECT c.id, c.user_id, c.email, c.full_name, c.phone,
           c.created_by_business_id
    INTO v_scanned_customer
    FROM customers c
    WHERE c.id = p_scanned_code::UUID
    LIMIT 1;
  END IF;

  -- Not found at all
  IF v_scanned_customer.id IS NULL THEN
    RETURN;
  END IF;

  -- Step 2: If customer belongs to this business (or has no business), return it
  IF v_scanned_customer.created_by_business_id IS NULL
     OR v_scanned_customer.created_by_business_id = p_business_id THEN
    RETURN QUERY
    SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
           c.tier, c.qr_code_url, c.full_name, c.email,
           c.card_token, c.created_by_business_id
    FROM customers c
    WHERE c.id = v_scanned_customer.id;
    RETURN;
  END IF;

  -- Step 3: Different business. Find matching record in this business.
  -- Try by user_id first (most reliable)
  IF v_scanned_customer.user_id IS NOT NULL THEN
    SELECT c.id INTO v_resolved_id
    FROM customers c
    WHERE c.user_id = v_scanned_customer.user_id
      AND c.created_by_business_id = p_business_id
    LIMIT 1;
  END IF;

  -- Try by email if no user_id match
  IF v_resolved_id IS NULL AND v_scanned_customer.email IS NOT NULL THEN
    SELECT c.id INTO v_resolved_id
    FROM customers c
    WHERE lower(c.email) = lower(v_scanned_customer.email)
      AND c.created_by_business_id = p_business_id
    LIMIT 1;
  END IF;

  -- Step 4: If found a matching record in this business, return it
  IF v_resolved_id IS NOT NULL THEN
    RETURN QUERY
    SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
           c.tier, c.qr_code_url, c.full_name, c.email,
           c.card_token, c.created_by_business_id
    FROM customers c
    WHERE c.id = v_resolved_id;
    RETURN;
  END IF;

  -- Step 5: No matching record in this business. Auto-create one.
  v_new_qr_token := encode(gen_random_bytes(12), 'base64');

  INSERT INTO customers (
    user_id, email, full_name, phone,
    total_points, lifetime_points, tier,
    qr_code_url, created_by_business_id
  ) VALUES (
    v_scanned_customer.user_id,
    v_scanned_customer.email,
    v_scanned_customer.full_name,
    v_scanned_customer.phone,
    0, 0, 'bronze',
    'NoxaLoyalty://customer/' || v_new_qr_token,
    p_business_id
  )
  RETURNING customers.id INTO v_resolved_id;

  -- Link to business
  INSERT INTO customer_businesses (customer_id, business_id)
  VALUES (v_resolved_id, p_business_id)
  ON CONFLICT DO NOTHING;

  RETURN QUERY
  SELECT c.id, c.user_id, c.total_points, c.lifetime_points,
         c.tier, c.qr_code_url, c.full_name, c.email,
         c.card_token, c.created_by_business_id
  FROM customers c
  WHERE c.id = v_resolved_id;
END;
$$;


ALTER FUNCTION "public"."resolve_customer_for_business"("p_scanned_code" "text", "p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_booking_confirmation_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_booking_confirmation_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_business_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_business_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_business_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_auto_link_customer_business"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO customer_businesses (customer_id, business_id, points)
  VALUES (NEW.customer_id, NEW.business_id, CASE WHEN NEW.type = 'earn' THEN NEW.points ELSE 0 END)
  ON CONFLICT (customer_id, business_id) DO UPDATE
  SET points = customer_businesses.points + CASE WHEN NEW.type = 'earn' THEN NEW.points WHEN NEW.type = 'redeem' THEN -NEW.points ELSE 0 END;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_auto_link_customer_business"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_auto_link_customer_by_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_existing_user_id UUID;
BEGIN
  -- Only act on new customers without a user_id but with an email
  IF NEW.user_id IS NOT NULL OR NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find an existing customer with the same email that is already linked
  SELECT user_id INTO v_existing_user_id
  FROM customers
  WHERE lower(email) = lower(NEW.email)
    AND user_id IS NOT NULL
    AND id != NEW.id
  LIMIT 1;

  -- If found, auto-link the new record to the same auth user
  IF v_existing_user_id IS NOT NULL THEN
    NEW.user_id := v_existing_user_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_auto_link_customer_by_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_branch_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE usage_tracking 
    SET branch_count = branch_count + 1, updated_at = NOW()
    WHERE business_id = NEW.business_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE usage_tracking 
    SET branch_count = GREATEST(0, branch_count - 1), updated_at = NOW()
    WHERE business_id = OLD.business_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle is_active toggle
    IF OLD.is_active = true AND NEW.is_active = false THEN
      UPDATE usage_tracking 
      SET branch_count = GREATEST(0, branch_count - 1), updated_at = NOW()
      WHERE business_id = NEW.business_id;
    ELSIF OLD.is_active = false AND NEW.is_active = true THEN
      UPDATE usage_tracking 
      SET branch_count = branch_count + 1, updated_at = NOW()
      WHERE business_id = NEW.business_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_update_branch_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_customer_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE usage_tracking 
    SET customer_count = customer_count + 1, updated_at = NOW()
    WHERE business_id = NEW.created_by_business_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE usage_tracking 
    SET customer_count = GREATEST(0, customer_count - 1), updated_at = NOW()
    WHERE business_id = OLD.created_by_business_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_update_customer_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_staff_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_active = true THEN
      UPDATE usage_tracking 
      SET staff_count = staff_count + 1, updated_at = NOW()
      WHERE business_id = NEW.business_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_active = true THEN
      UPDATE usage_tracking 
      SET staff_count = GREATEST(0, staff_count - 1), updated_at = NOW()
      WHERE business_id = OLD.business_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle is_active toggle
    IF OLD.is_active = true AND NEW.is_active = false THEN
      UPDATE usage_tracking 
      SET staff_count = GREATEST(0, staff_count - 1), updated_at = NOW()
      WHERE business_id = NEW.business_id;
    ELSIF OLD.is_active = false AND NEW.is_active = true THEN
      UPDATE usage_tracking 
      SET staff_count = staff_count + 1, updated_at = NOW()
      WHERE business_id = NEW.business_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_update_staff_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_booking_addon_options_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_booking_addon_options_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_booking_addons_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_booking_addons_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer_tier"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.tier := get_customer_tier(NEW.lifetime_points);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_customer_tier"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_products_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_products_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sales_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_sales_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_service_addons_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_service_addons_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_service_price_variants_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_service_price_variants_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_service_questions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_service_questions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_staff_last_login"("p_staff_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.staff
  SET last_login = NOW()
  WHERE id = p_staff_id;
END;
$$;


ALTER FUNCTION "public"."update_staff_last_login"("p_staff_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_usage_counts"("p_business_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE usage_tracking
  SET 
    customer_count = (
      SELECT COUNT(*) FROM customers 
      WHERE created_by_business_id = p_business_id
    ),
    branch_count = (
      SELECT COUNT(*) FROM branches 
      WHERE business_id = p_business_id AND is_active = true
    ),
    staff_count = (
      SELECT COUNT(*) FROM staff 
      WHERE business_id = p_business_id AND is_active = true
    ),
    updated_at = NOW()
  WHERE business_id = p_business_id;
END;
$$;


ALTER FUNCTION "public"."update_usage_counts"("p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_customer_otp"("p_code" "text", "p_email" "text", "p_business_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_record verification_codes%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Find the most recent unexpired, unverified code for this email + business
  SELECT * INTO v_record
  FROM verification_codes
  WHERE email = LOWER(TRIM(p_email))
    AND business_id = p_business_id
    AND verified_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- No code found
  IF v_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_code_found',
      'message', 'No verification code found. Please request a new one.'
    );
  END IF;

  -- Max attempts exceeded
  IF v_record.attempts >= v_record.max_attempts THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'max_attempts',
      'message', 'Too many attempts. Please request a new code.'
    );
  END IF;

  -- Increment attempts
  UPDATE verification_codes
  SET attempts = attempts + 1
  WHERE id = v_record.id;

  -- Check code
  IF v_record.code != p_code THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_code',
      'message', 'Invalid verification code. Please try again.',
      'attempts_remaining', v_record.max_attempts - v_record.attempts - 1
    );
  END IF;

  -- Code is correct — mark as verified
  UPDATE verification_codes
  SET verified_at = NOW()
  WHERE id = v_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'verification_id', v_record.id,
    'purpose', v_record.purpose
  );
END;
$$;


ALTER FUNCTION "public"."verify_customer_otp"("p_code" "text", "p_email" "text", "p_business_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_redemption_code"("p_code" "text", "p_business_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT
    r.id,
    r.redemption_code,
    r.points_used,
    r.status,
    r.expires_at,
    r.created_at,
    c.full_name AS customer_name,
    c.email AS customer_email,
    rw.title AS reward_title
  INTO v_rec
  FROM redemptions r
  LEFT JOIN customers c ON c.id = r.customer_id
  LEFT JOIN rewards rw ON rw.id = r.reward_id
  WHERE r.redemption_code ILIKE p_code
    AND r.business_id = p_business_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('found', false);
  END IF;

  RETURN json_build_object(
    'found', true,
    'id', v_rec.id,
    'redemption_code', v_rec.redemption_code,
    'points_used', v_rec.points_used,
    'status', v_rec.status,
    'expires_at', v_rec.expires_at,
    'created_at', v_rec.created_at,
    'customer_name', COALESCE(v_rec.customer_name, v_rec.customer_email, 'Customer'),
    'customer_email', v_rec.customer_email,
    'reward_title', COALESCE(v_rec.reward_title, 'Unknown Reward')
  );
END;
$$;


ALTER FUNCTION "public"."verify_redemption_code"("p_code" "text", "p_business_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "city" "text",
    "phone" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "qr_code_url" "text",
    "points_per_purchase" integer DEFAULT 10,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "pesos_per_point" integer DEFAULT 10,
    "min_purchase_for_points" numeric(10,2) DEFAULT 0,
    "max_points_per_transaction" integer,
    "points_expiry_days" integer,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "business_type" "text",
    "phone" "text",
    "owner_email" "text",
    "address" "text",
    "city" "text",
    "description" "text",
    "is_free_forever" boolean DEFAULT false NOT NULL,
    "subscription_status" "public"."subscription_status" DEFAULT 'preview'::"public"."subscription_status" NOT NULL,
    "xendit_customer_id" character varying(255),
    "xendit_payment_method_id" character varying(255),
    "slug" "text" NOT NULL,
    "join_code" "text",
    "referral_reward_points" integer DEFAULT 25 NOT NULL
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "followed_at" timestamp with time zone DEFAULT "now"(),
    "points" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."customer_businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "price_monthly" integer,
    "price_annual" integer,
    "max_customers" integer,
    "max_branches" integer,
    "max_staff_per_branch" integer,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "has_loyalty" boolean DEFAULT true NOT NULL,
    "has_booking" boolean DEFAULT false NOT NULL,
    "has_pos" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "role" "public"."staff_role" DEFAULT 'cashier'::"public"."staff_role" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "invited_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_login" timestamp with time zone,
    "email_verified_at" timestamp with time zone,
    "invite_id" "uuid",
    "scans_today" integer DEFAULT 0,
    "points_awarded_today" integer DEFAULT 0,
    "last_scan_at" timestamp with time zone,
    "branch_name" "text",
    "branch_id" "uuid"
);


ALTER TABLE "public"."staff" OWNER TO "postgres";


COMMENT ON TABLE "public"."staff" IS 'Business team members with role-based access';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "xendit_subscription_id" character varying(255),
    "xendit_customer_id" character varying(255),
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "billing_interval" character varying(20) DEFAULT 'monthly'::character varying NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "cancellation_reason" character varying(255),
    "cancellation_feedback" "text",
    "is_free_forever" boolean DEFAULT false,
    "trial_ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "module_booking_override" boolean,
    "module_pos_override" boolean
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "reward_id" "uuid",
    "points" integer NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "amount_spent" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "description" "text"
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_business_stats" AS
 SELECT "b"."id",
    "b"."name",
    "b"."slug",
    "b"."owner_email",
    "b"."created_at",
    "b"."subscription_status",
    "b"."business_type",
    "b"."phone",
    "p"."display_name" AS "plan_name",
    ( SELECT "count"(*) AS "count"
           FROM "public"."customer_businesses" "cb"
          WHERE ("cb"."business_id" = "b"."id")) AS "customer_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."staff" "s"
          WHERE (("s"."business_id" = "b"."id") AND ("s"."is_active" = true))) AS "staff_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."transactions" "t"
          WHERE ("t"."business_id" = "b"."id")) AS "transaction_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."transactions" "t"
          WHERE (("t"."business_id" = "b"."id") AND ("t"."created_at" >= ("now"() - '30 days'::interval)))) AS "transactions_30d",
    ( SELECT "count"(*) AS "count"
           FROM "public"."branches" "br"
          WHERE (("br"."business_id" = "b"."id") AND ("br"."is_active" = true))) AS "branch_count",
    ( SELECT COALESCE("sum"("t"."points"), (0)::bigint) AS "coalesce"
           FROM "public"."transactions" "t"
          WHERE (("t"."business_id" = "b"."id") AND ("t"."type" = 'earn'::"public"."transaction_type"))) AS "points_issued",
    ( SELECT "max"("t"."created_at") AS "max"
           FROM "public"."transactions" "t"
          WHERE ("t"."business_id" = "b"."id")) AS "last_active_at"
   FROM (("public"."businesses" "b"
     LEFT JOIN "public"."subscriptions" "sub" ON (("sub"."business_id" = "b"."id")))
     LEFT JOIN "public"."plans" "p" ON (("p"."id" = "sub"."plan_id")));


ALTER VIEW "public"."admin_business_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "author_email" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_plan_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "changed_by_email" "text" NOT NULL,
    "old_plan_id" "uuid",
    "new_plan_id" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_plan_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "branch_id" "uuid",
    "service_id" "uuid" NOT NULL,
    "staff_id" "uuid",
    "customer_id" "uuid",
    "customer_name" "text",
    "customer_email" "text",
    "customer_phone" "text",
    "booking_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "status" "public"."booking_status" DEFAULT 'pending'::"public"."booking_status" NOT NULL,
    "notes" "text",
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "confirmation_code" character varying(10),
    "total_price_centavos" integer,
    "nights" integer,
    "end_date" "date",
    "guests_adults" integer DEFAULT 1,
    "guests_children" integer DEFAULT 0,
    "addons_json" "jsonb" DEFAULT '[]'::"jsonb",
    "subtotal_centavos" integer,
    "addons_total_centavos" integer DEFAULT 0,
    "special_requests" "text",
    "party_size" integer,
    "variant_id" "uuid",
    CONSTRAINT "bookings_customer_info" CHECK ((("customer_id" IS NOT NULL) OR (("customer_name" IS NOT NULL) AND (("customer_email" IS NOT NULL) OR ("customer_phone" IS NOT NULL))))),
    CONSTRAINT "bookings_time_order" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "phone" "text",
    "total_points" integer DEFAULT 0,
    "qr_code_url" "text",
    "last_visit" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tier" "text" DEFAULT 'bronze'::"text",
    "lifetime_points" integer DEFAULT 0,
    "email" "text",
    "full_name" "text",
    "age" integer,
    "created_by_staff_id" "uuid",
    "created_by_business_id" "uuid",
    "card_token" "text",
    "card_token_created_at" timestamp with time zone,
    "email_sent_at" timestamp with time zone,
    "email_sent_count" integer DEFAULT 0,
    "is_verified" boolean DEFAULT false NOT NULL,
    "verified_at" timestamp with time zone,
    "verification_method" "text"
);

ALTER TABLE ONLY "public"."customers" REPLICA IDENTITY FULL;


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_platform_stats" AS
 SELECT ( SELECT "count"(*) AS "count"
           FROM "public"."businesses") AS "total_businesses",
    ( SELECT "count"(*) AS "count"
           FROM "public"."businesses"
          WHERE ("businesses"."created_at" >= ("now"() - '30 days'::interval))) AS "businesses_30d",
    ( SELECT "count"(*) AS "count"
           FROM "public"."businesses"
          WHERE ("businesses"."created_at" >= ("now"() - '7 days'::interval))) AS "businesses_7d",
    ( SELECT "count"(*) AS "count"
           FROM ("public"."subscriptions" "s"
             JOIN "public"."plans" "p" ON (("p"."id" = "s"."plan_id")))
          WHERE ((("p"."name")::"text" = 'enterprise'::"text") AND (("s"."status")::"text" = 'active'::"text"))) AS "enterprise_count",
    ( SELECT "count"(*) AS "count"
           FROM ("public"."subscriptions" "s"
             JOIN "public"."plans" "p" ON (("p"."id" = "s"."plan_id")))
          WHERE ((("p"."name")::"text" = 'free'::"text") AND (("s"."status")::"text" = 'active'::"text"))) AS "free_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."customers") AS "total_customers",
    ( SELECT "count"(*) AS "count"
           FROM "public"."customers"
          WHERE ("customers"."created_at" >= ("now"() - '30 days'::interval))) AS "customers_30d",
    ( SELECT "count"(*) AS "count"
           FROM "public"."transactions") AS "total_transactions",
    ( SELECT "count"(*) AS "count"
           FROM "public"."transactions"
          WHERE ("transactions"."created_at" >= ("now"() - '30 days'::interval))) AS "transactions_30d",
    ( SELECT COALESCE("sum"("transactions"."points"), (0)::bigint) AS "coalesce"
           FROM "public"."transactions"
          WHERE ("transactions"."type" = 'earn'::"public"."transaction_type")) AS "total_points_issued",
    ( SELECT COALESCE("sum"("transactions"."points"), (0)::bigint) AS "coalesce"
           FROM "public"."transactions"
          WHERE (("transactions"."type" = 'earn'::"public"."transaction_type") AND ("transactions"."created_at" >= ("now"() - '30 days'::interval)))) AS "points_issued_30d",
    ( SELECT "count"(*) AS "count"
           FROM "public"."bookings") AS "total_bookings",
    ( SELECT "count"(*) AS "count"
           FROM "public"."bookings"
          WHERE ("bookings"."created_at" >= ("now"() - '30 days'::interval))) AS "bookings_30d",
    ( SELECT "count"(*) AS "count"
           FROM "public"."subscriptions"
          WHERE (("subscriptions"."status")::"text" = 'active'::"text")) AS "active_subscriptions";


ALTER VIEW "public"."admin_platform_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "tag" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" character varying(100) NOT NULL,
    "severity" character varying(20) DEFAULT 'info'::character varying,
    "business_id" "uuid",
    "user_id" "uuid",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "branch_id" "uuid",
    "staff_id" "uuid",
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "availability_day_of_week_valid" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "availability_time_order" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_addon_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "addon_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "price_centavos" integer DEFAULT 0 NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_addon_options_price_centavos_check" CHECK (("price_centavos" >= 0))
);


ALTER TABLE "public"."booking_addon_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_addon_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "addon_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1,
    "unit_price_centavos" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_addon_selections_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."booking_addon_selections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_addons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "price_centavos" integer NOT NULL,
    "duration_minutes" integer,
    "category" character varying(50),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_addons_price_centavos_check" CHECK (("price_centavos" >= 0))
);


ALTER TABLE "public"."booking_addons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "to_email" "text" NOT NULL,
    "to_name" "text",
    "subject" "text" NOT NULL,
    "template_id" "text" NOT NULL,
    "template_data" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "attempts" integer DEFAULT 0,
    "max_attempts" integer DEFAULT 3,
    "last_error" "text",
    "external_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "sent_at" timestamp with time zone,
    "next_retry_at" timestamp with time zone,
    CONSTRAINT "email_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sending'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."email_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instruments" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."instruments" OWNER TO "postgres";


ALTER TABLE "public"."instruments" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."instruments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid",
    "business_id" "uuid" NOT NULL,
    "stripe_invoice_id" "text" NOT NULL,
    "stripe_invoice_number" "text",
    "stripe_hosted_invoice_url" "text",
    "stripe_invoice_pdf" "text",
    "amount_due_centavos" integer NOT NULL,
    "amount_paid_centavos" integer DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'PHP'::"text" NOT NULL,
    "status" "public"."invoice_status" DEFAULT 'draft'::"public"."invoice_status" NOT NULL,
    "period_start" timestamp with time zone,
    "period_end" timestamp with time zone,
    "due_date" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "xendit_cycle_id" character varying(255),
    "xendit_subscription_id" character varying(255),
    "amount" integer NOT NULL,
    "currency" character varying(3) DEFAULT 'PHP'::character varying,
    "status" character varying(50) NOT NULL,
    "failure_reason" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid",
    "business_id" "uuid" NOT NULL,
    "amount_centavos" integer NOT NULL,
    "currency" "text" DEFAULT 'PHP'::"text" NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "stripe_payment_intent_id" "text",
    "stripe_invoice_id" "text",
    "stripe_charge_id" "text",
    "description" "text",
    "failure_reason" "text",
    "receipt_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "price_centavos" integer NOT NULL,
    "category" character varying(100),
    "sku" character varying(50),
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text",
    "stock_quantity" integer DEFAULT 0 NOT NULL,
    "low_stock_threshold" integer DEFAULT 5 NOT NULL,
    CONSTRAINT "products_price_centavos_check" CHECK (("price_centavos" >= 0))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."image_url" IS 'URL to product image stored in Supabase Storage';



CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identifier" "text" NOT NULL,
    "identifier_type" "text" NOT NULL,
    "action" "text" NOT NULL,
    "request_count" integer DEFAULT 1,
    "window_start" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rate_limits_identifier_type_check" CHECK (("identifier_type" = ANY (ARRAY['ip_address'::"text", 'user_id'::"text", 'phone'::"text", 'email'::"text"])))
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "reward_id" "uuid" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "points_used" integer NOT NULL,
    "redemption_code" "text" NOT NULL,
    "status" "public"."redemption_status" DEFAULT 'pending'::"public"."redemption_status",
    "expires_at" timestamp with time zone NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "uses" integer DEFAULT 0 NOT NULL,
    "max_uses" integer DEFAULT 20 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."referral_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_completions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referral_code_id" "uuid" NOT NULL,
    "referrer_customer_id" "uuid" NOT NULL,
    "invitee_customer_id" "uuid" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "referrer_points" integer NOT NULL,
    "invitee_points" integer NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."referral_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "points_cost" integer NOT NULL,
    "stock" integer DEFAULT 0,
    "image_url" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'food'::"text",
    "is_active" boolean DEFAULT true,
    "is_visible" boolean DEFAULT true,
    "discount_type" "text",
    "discount_value" numeric(10,2),
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tier_required" "text" DEFAULT 'bronze'::"text"
);


ALTER TABLE "public"."rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "public"."app_role" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sale_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sale_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "name" character varying(255) NOT NULL,
    "description" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price_centavos" integer NOT NULL,
    "total_centavos" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sale_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "sale_items_total_centavos_check" CHECK (("total_centavos" >= 0)),
    CONSTRAINT "sale_items_unit_price_centavos_check" CHECK (("unit_price_centavos" >= 0))
);


ALTER TABLE "public"."sale_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "branch_id" "uuid",
    "customer_id" "uuid",
    "staff_id" "uuid",
    "sale_number" character varying(20) NOT NULL,
    "subtotal_centavos" integer DEFAULT 0 NOT NULL,
    "discount_centavos" integer DEFAULT 0 NOT NULL,
    "discount_type" character varying(20),
    "discount_reason" character varying(255),
    "total_centavos" integer NOT NULL,
    "payment_method" character varying(20) NOT NULL,
    "payment_reference" character varying(100),
    "amount_tendered_centavos" integer,
    "change_centavos" integer,
    "points_earned" integer DEFAULT 0,
    "points_redeemed" integer DEFAULT 0,
    "reward_id" "uuid",
    "notes" "text",
    "status" character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    "voided_at" timestamp with time zone,
    "voided_by" "uuid",
    "void_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sales_discount_centavos_check" CHECK (("discount_centavos" >= 0)),
    CONSTRAINT "sales_subtotal_centavos_check" CHECK (("subtotal_centavos" >= 0)),
    CONSTRAINT "sales_total_centavos_check" CHECK (("total_centavos" >= 0))
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scan_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "points_awarded" integer DEFAULT 0 NOT NULL,
    "transaction_amount" numeric(10,2),
    "scanned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."scan_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_addons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "service_id" "uuid",
    "name" character varying(100) NOT NULL,
    "description" "text",
    "price_centavos" integer DEFAULT 0 NOT NULL,
    "price_type" character varying(20) DEFAULT 'fixed'::character varying,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_addons_price_centavos_check" CHECK (("price_centavos" >= 0)),
    CONSTRAINT "service_addons_price_type_check" CHECK ((("price_type")::"text" = ANY ((ARRAY['fixed'::character varying, 'per_day'::character varying, 'per_person'::character varying])::"text"[])))
);


ALTER TABLE "public"."service_addons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_price_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "price_centavos" integer DEFAULT 0 NOT NULL,
    "description" "text",
    "capacity" integer,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_price_variants_price_centavos_check" CHECK (("price_centavos" >= 0))
);


ALTER TABLE "public"."service_price_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "question_type" character varying(20) DEFAULT 'text'::character varying NOT NULL,
    "options" "jsonb" DEFAULT '[]'::"jsonb",
    "is_required" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_questions_question_type_check" CHECK ((("question_type")::"text" = ANY ((ARRAY['text'::character varying, 'select'::character varying, 'checkbox'::character varying, 'number'::character varying])::"text"[])))
);


ALTER TABLE "public"."service_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "branch_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "duration_minutes" integer DEFAULT 30 NOT NULL,
    "price_centavos" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "max_guests" integer DEFAULT 1,
    "requires_time_slot" boolean DEFAULT true,
    "image_url" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "category" character varying(50),
    "buffer_minutes" integer DEFAULT 0,
    "pricing_type" character varying(20) DEFAULT 'fixed'::character varying,
    "deposit_percentage" integer DEFAULT 0,
    "allow_staff_selection" boolean DEFAULT false,
    "inventory_count" integer DEFAULT 1,
    CONSTRAINT "services_deposit_percentage_check" CHECK ((("deposit_percentage" >= 0) AND ("deposit_percentage" <= 100))),
    CONSTRAINT "services_duration_positive" CHECK (("duration_minutes" > 0)),
    CONSTRAINT "services_inventory_count_check" CHECK (("inventory_count" >= 1)),
    CONSTRAINT "services_price_non_negative" CHECK ((("price_centavos" IS NULL) OR ("price_centavos" >= 0))),
    CONSTRAINT "services_pricing_type_check" CHECK ((("pricing_type")::"text" = ANY ((ARRAY['fixed'::character varying, 'per_hour'::character varying, 'per_session'::character varying, 'per_night'::character varying, 'starting_at'::character varying])::"text"[])))
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" DEFAULT 'cashier'::"text" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "branch_name" "text",
    CONSTRAINT "staff_invites_role_check" CHECK (("role" = ANY (ARRAY['manager'::"text", 'cashier'::"text"]))),
    CONSTRAINT "staff_invites_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."staff_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."staff_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "movement_type" character varying(20) NOT NULL,
    "quantity" integer NOT NULL,
    "stock_before" integer NOT NULL,
    "stock_after" integer NOT NULL,
    "performed_by" "uuid",
    "performer_name" character varying(255),
    "reason" "text",
    "reference_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tier_config" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "min_points" integer NOT NULL,
    "multiplier" numeric(3,2) DEFAULT 1.0,
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tier_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "customer_count" integer DEFAULT 0 NOT NULL,
    "branch_count" integer DEFAULT 0 NOT NULL,
    "staff_count" integer DEFAULT 0 NOT NULL,
    "transactions_this_month" integer DEFAULT 0 NOT NULL,
    "points_issued_this_month" integer DEFAULT 0 NOT NULL,
    "last_reset_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usage_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "code" "text" NOT NULL,
    "business_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "purpose" "text" DEFAULT 'signup'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 5 NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."verification_codes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_notes"
    ADD CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_plan_changes"
    ADD CONSTRAINT "admin_plan_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_tags"
    ADD CONSTRAINT "admin_tags_business_id_tag_key" UNIQUE ("business_id", "tag");



ALTER TABLE ONLY "public"."admin_tags"
    ADD CONSTRAINT "admin_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_addon_options"
    ADD CONSTRAINT "booking_addon_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_addon_selections"
    ADD CONSTRAINT "booking_addon_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_addons"
    ADD CONSTRAINT "booking_addons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_confirmation_code_key" UNIQUE ("confirmation_code");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_join_code_key" UNIQUE ("join_code");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."customer_businesses"
    ADD CONSTRAINT "customer_businesses_customer_id_business_id_key" UNIQUE ("customer_id", "business_id");



ALTER TABLE ONLY "public"."customer_businesses"
    ADD CONSTRAINT "customer_businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_card_token_key" UNIQUE ("card_token");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instruments"
    ADD CONSTRAINT "instruments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_stripe_invoice_id_key" UNIQUE ("stripe_invoice_id");



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_identifier_identifier_type_action_key" UNIQUE ("identifier", "identifier_type", "action");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_redemption_code_key" UNIQUE ("redemption_code");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_customer_id_business_id_key" UNIQUE ("customer_id", "business_id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_completions"
    ADD CONSTRAINT "referral_completions_invitee_customer_id_business_id_key" UNIQUE ("invitee_customer_id", "business_id");



ALTER TABLE ONLY "public"."referral_completions"
    ADD CONSTRAINT "referral_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scan_logs"
    ADD CONSTRAINT "scan_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_addons"
    ADD CONSTRAINT "service_addons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_price_variants"
    ADD CONSTRAINT "service_price_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_questions"
    ADD CONSTRAINT "service_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_invites"
    ADD CONSTRAINT "staff_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_invites"
    ADD CONSTRAINT "staff_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_services"
    ADD CONSTRAINT "staff_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_services"
    ADD CONSTRAINT "staff_services_unique" UNIQUE ("staff_id", "service_id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_user_business_unique" UNIQUE ("user_id", "business_id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_business_id_key" UNIQUE ("business_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tier_config"
    ADD CONSTRAINT "tier_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_tracking"
    ADD CONSTRAINT "usage_tracking_business_id_key" UNIQUE ("business_id");



ALTER TABLE ONLY "public"."usage_tracking"
    ADD CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_codes"
    ADD CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_logs_business" ON "public"."audit_logs" USING "btree" ("business_id", "created_at" DESC);



CREATE INDEX "idx_audit_logs_business_id" ON "public"."audit_logs" USING "btree" ("business_id");



CREATE INDEX "idx_audit_logs_event_type" ON "public"."audit_logs" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "idx_audit_logs_severity" ON "public"."audit_logs" USING "btree" ("severity", "created_at" DESC);



CREATE INDEX "idx_availability_branch_id" ON "public"."availability" USING "btree" ("branch_id");



CREATE INDEX "idx_availability_business_id" ON "public"."availability" USING "btree" ("business_id");



CREATE INDEX "idx_availability_business_public" ON "public"."availability" USING "btree" ("business_id") WHERE (("branch_id" IS NULL) AND ("staff_id" IS NULL));



CREATE INDEX "idx_availability_day_of_week" ON "public"."availability" USING "btree" ("day_of_week");



CREATE INDEX "idx_availability_staff_id" ON "public"."availability" USING "btree" ("staff_id");



CREATE INDEX "idx_booking_addon_options_active" ON "public"."booking_addon_options" USING "btree" ("addon_id", "is_active");



CREATE INDEX "idx_booking_addon_options_addon_id" ON "public"."booking_addon_options" USING "btree" ("addon_id");



CREATE INDEX "idx_booking_addon_selections_addon_id" ON "public"."booking_addon_selections" USING "btree" ("addon_id");



CREATE INDEX "idx_booking_addon_selections_booking_id" ON "public"."booking_addon_selections" USING "btree" ("booking_id");



CREATE INDEX "idx_booking_addons_active" ON "public"."booking_addons" USING "btree" ("business_id", "is_active");



CREATE INDEX "idx_booking_addons_business_id" ON "public"."booking_addons" USING "btree" ("business_id");



CREATE INDEX "idx_bookings_booking_date" ON "public"."bookings" USING "btree" ("booking_date");



CREATE INDEX "idx_bookings_branch_id" ON "public"."bookings" USING "btree" ("branch_id");



CREATE INDEX "idx_bookings_business_date" ON "public"."bookings" USING "btree" ("business_id", "booking_date");



CREATE INDEX "idx_bookings_business_date_status" ON "public"."bookings" USING "btree" ("business_id", "booking_date", "status");



CREATE INDEX "idx_bookings_business_id" ON "public"."bookings" USING "btree" ("business_id");



CREATE INDEX "idx_bookings_confirmation_code" ON "public"."bookings" USING "btree" ("confirmation_code");



CREATE INDEX "idx_bookings_customer_id" ON "public"."bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_bookings_service_id" ON "public"."bookings" USING "btree" ("service_id");



CREATE INDEX "idx_bookings_staff_date" ON "public"."bookings" USING "btree" ("staff_id", "booking_date") WHERE ("staff_id" IS NOT NULL);



CREATE INDEX "idx_bookings_staff_id" ON "public"."bookings" USING "btree" ("staff_id");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_branches_business_id" ON "public"."branches" USING "btree" ("business_id");



CREATE INDEX "idx_businesses_slug" ON "public"."businesses" USING "btree" ("slug");



CREATE INDEX "idx_businesses_subscription_status" ON "public"."businesses" USING "btree" ("subscription_status");



CREATE INDEX "idx_customers_card_token" ON "public"."customers" USING "btree" ("card_token") WHERE ("card_token" IS NOT NULL);



CREATE INDEX "idx_customers_created_by_business" ON "public"."customers" USING "btree" ("created_by_business_id") WHERE ("created_by_business_id" IS NOT NULL);



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email") WHERE ("email" IS NOT NULL);



CREATE UNIQUE INDEX "idx_customers_phone_business" ON "public"."customers" USING "btree" ("phone", "created_by_business_id") WHERE (("phone" IS NOT NULL) AND ("created_by_business_id" IS NOT NULL));



CREATE INDEX "idx_email_queue_status" ON "public"."email_queue" USING "btree" ("status", "next_retry_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'failed'::"text"]));



CREATE INDEX "idx_invoices_business_id" ON "public"."invoices" USING "btree" ("business_id");



CREATE INDEX "idx_invoices_stripe_invoice" ON "public"."invoices" USING "btree" ("stripe_invoice_id");



CREATE INDEX "idx_payment_history_business_id" ON "public"."payment_history" USING "btree" ("business_id");



CREATE INDEX "idx_payments_business_id" ON "public"."payments" USING "btree" ("business_id");



CREATE INDEX "idx_payments_stripe_payment_intent" ON "public"."payments" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "idx_payments_subscription_id" ON "public"."payments" USING "btree" ("subscription_id");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("business_id", "is_active");



CREATE INDEX "idx_products_business_id" ON "public"."products" USING "btree" ("business_id");



CREATE INDEX "idx_products_sku" ON "public"."products" USING "btree" ("business_id", "sku") WHERE ("sku" IS NOT NULL);



CREATE INDEX "idx_rate_limits_lookup" ON "public"."rate_limits" USING "btree" ("identifier", "identifier_type", "action", "window_start");



CREATE INDEX "idx_redemptions_code" ON "public"."redemptions" USING "btree" ("redemption_code");



CREATE INDEX "idx_redemptions_customer_status" ON "public"."redemptions" USING "btree" ("customer_id", "status");



CREATE INDEX "idx_referral_codes_business" ON "public"."referral_codes" USING "btree" ("business_id");



CREATE INDEX "idx_referral_codes_code" ON "public"."referral_codes" USING "btree" ("code");



CREATE INDEX "idx_referral_codes_customer" ON "public"."referral_codes" USING "btree" ("customer_id");



CREATE INDEX "idx_referral_completions_business" ON "public"."referral_completions" USING "btree" ("business_id");



CREATE INDEX "idx_referral_completions_referrer" ON "public"."referral_completions" USING "btree" ("referrer_customer_id");



CREATE INDEX "idx_rewards_active_visible" ON "public"."rewards" USING "btree" ("business_id", "is_active", "is_visible");



CREATE INDEX "idx_sale_items_product_id" ON "public"."sale_items" USING "btree" ("product_id");



CREATE INDEX "idx_sale_items_sale_id" ON "public"."sale_items" USING "btree" ("sale_id");



CREATE INDEX "idx_sales_business_id" ON "public"."sales" USING "btree" ("business_id");



CREATE INDEX "idx_sales_created_at" ON "public"."sales" USING "btree" ("business_id", "created_at" DESC);



CREATE INDEX "idx_sales_customer_id" ON "public"."sales" USING "btree" ("customer_id");



CREATE INDEX "idx_sales_sale_number" ON "public"."sales" USING "btree" ("business_id", "sale_number");



CREATE INDEX "idx_sales_status" ON "public"."sales" USING "btree" ("business_id", "status");



CREATE INDEX "idx_scan_logs_business" ON "public"."scan_logs" USING "btree" ("business_id");



CREATE INDEX "idx_scan_logs_date" ON "public"."scan_logs" USING "btree" ("scanned_at");



CREATE INDEX "idx_scan_logs_staff" ON "public"."scan_logs" USING "btree" ("staff_id");



CREATE INDEX "idx_service_addons_active" ON "public"."service_addons" USING "btree" ("business_id", "is_active");



CREATE INDEX "idx_service_addons_business_id" ON "public"."service_addons" USING "btree" ("business_id");



CREATE INDEX "idx_service_addons_service_id" ON "public"."service_addons" USING "btree" ("service_id");



CREATE INDEX "idx_service_price_variants_active" ON "public"."service_price_variants" USING "btree" ("service_id", "is_active");



CREATE INDEX "idx_service_price_variants_service_id" ON "public"."service_price_variants" USING "btree" ("service_id");



CREATE INDEX "idx_service_questions_service_id" ON "public"."service_questions" USING "btree" ("service_id");



CREATE INDEX "idx_services_active_business" ON "public"."services" USING "btree" ("business_id", "is_active");



CREATE INDEX "idx_services_branch_id" ON "public"."services" USING "btree" ("branch_id");



CREATE INDEX "idx_services_business_id" ON "public"."services" USING "btree" ("business_id");



CREATE INDEX "idx_services_is_active" ON "public"."services" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_staff_business_id" ON "public"."staff" USING "btree" ("business_id");



CREATE INDEX "idx_staff_invites_business" ON "public"."staff_invites" USING "btree" ("business_id");



CREATE INDEX "idx_staff_invites_email" ON "public"."staff_invites" USING "btree" ("email");



CREATE INDEX "idx_staff_invites_status" ON "public"."staff_invites" USING "btree" ("status");



CREATE INDEX "idx_staff_invites_token" ON "public"."staff_invites" USING "btree" ("token");



CREATE INDEX "idx_staff_role" ON "public"."staff" USING "btree" ("role");



CREATE INDEX "idx_staff_services_service_id" ON "public"."staff_services" USING "btree" ("service_id");



CREATE INDEX "idx_staff_services_staff_id" ON "public"."staff_services" USING "btree" ("staff_id");



CREATE INDEX "idx_staff_user_id" ON "public"."staff" USING "btree" ("user_id");



CREATE INDEX "idx_stock_movements_business_date" ON "public"."stock_movements" USING "btree" ("business_id", "created_at" DESC);



CREATE INDEX "idx_stock_movements_business_type" ON "public"."stock_movements" USING "btree" ("business_id", "movement_type");



CREATE INDEX "idx_stock_movements_product_date" ON "public"."stock_movements" USING "btree" ("product_id", "created_at" DESC);



CREATE INDEX "idx_stock_movements_reference" ON "public"."stock_movements" USING "btree" ("reference_id") WHERE ("reference_id" IS NOT NULL);



CREATE INDEX "idx_subscriptions_active" ON "public"."subscriptions" USING "btree" ("business_id") WHERE (("status")::"text" = 'active'::"text");



CREATE INDEX "idx_subscriptions_business_id" ON "public"."subscriptions" USING "btree" ("business_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_xendit_id" ON "public"."subscriptions" USING "btree" ("xendit_subscription_id");



CREATE INDEX "idx_transactions_business" ON "public"."transactions" USING "btree" ("business_id", "created_at" DESC);



CREATE INDEX "idx_transactions_customer" ON "public"."transactions" USING "btree" ("customer_id", "created_at" DESC);



CREATE INDEX "idx_usage_tracking_business_id" ON "public"."usage_tracking" USING "btree" ("business_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role_id" ON "public"."users" USING "btree" ("role_id");



CREATE INDEX "idx_verification_codes_email_business" ON "public"."verification_codes" USING "btree" ("email", "business_id") WHERE ("verified_at" IS NULL);



CREATE INDEX "idx_verification_codes_expires" ON "public"."verification_codes" USING "btree" ("expires_at") WHERE ("verified_at" IS NULL);



CREATE UNIQUE INDEX "unique_active_subscription_per_business" ON "public"."subscriptions" USING "btree" ("business_id") WHERE (("status")::"text" = 'active'::"text");



CREATE OR REPLACE TRIGGER "availability_updated_at" BEFORE UPDATE ON "public"."availability" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "customer_tier_update" BEFORE UPDATE OF "lifetime_points" ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_customer_tier"();



CREATE OR REPLACE TRIGGER "on_staff_created_or_updated" AFTER INSERT OR UPDATE ON "public"."staff" FOR EACH ROW EXECUTE FUNCTION "public"."handle_staff_sync"();



CREATE OR REPLACE TRIGGER "on_users_updated" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_users_updated_at"();



CREATE OR REPLACE TRIGGER "services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_auto_link_customer_business" AFTER INSERT ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."trg_auto_link_customer_business"();



CREATE OR REPLACE TRIGGER "trg_auto_link_customer_by_email" BEFORE INSERT ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."trg_auto_link_customer_by_email"();



CREATE OR REPLACE TRIGGER "trigger_booking_addon_options_updated_at" BEFORE UPDATE ON "public"."booking_addon_options" FOR EACH ROW EXECUTE FUNCTION "public"."update_booking_addon_options_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_booking_addons_updated_at" BEFORE UPDATE ON "public"."booking_addons" FOR EACH ROW EXECUTE FUNCTION "public"."update_booking_addons_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_branch_count" AFTER INSERT OR DELETE OR UPDATE OF "is_active" ON "public"."branches" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_branch_count"();



CREATE OR REPLACE TRIGGER "trigger_customer_count_delete" AFTER DELETE ON "public"."customers" FOR EACH ROW WHEN (("old"."created_by_business_id" IS NOT NULL)) EXECUTE FUNCTION "public"."trigger_update_customer_count"();



CREATE OR REPLACE TRIGGER "trigger_customer_count_insert" AFTER INSERT ON "public"."customers" FOR EACH ROW WHEN (("new"."created_by_business_id" IS NOT NULL)) EXECUTE FUNCTION "public"."trigger_update_customer_count"();



CREATE OR REPLACE TRIGGER "trigger_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_products_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_sales_updated_at" BEFORE UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION "public"."update_sales_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_service_addons_updated_at" BEFORE UPDATE ON "public"."service_addons" FOR EACH ROW EXECUTE FUNCTION "public"."update_service_addons_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_service_price_variants_updated_at" BEFORE UPDATE ON "public"."service_price_variants" FOR EACH ROW EXECUTE FUNCTION "public"."update_service_price_variants_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_service_questions_updated_at" BEFORE UPDATE ON "public"."service_questions" FOR EACH ROW EXECUTE FUNCTION "public"."update_service_questions_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_set_booking_code" BEFORE INSERT ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_booking_confirmation_code"();



CREATE OR REPLACE TRIGGER "trigger_set_business_slug" BEFORE INSERT ON "public"."businesses" FOR EACH ROW EXECUTE FUNCTION "public"."set_business_slug"();



CREATE OR REPLACE TRIGGER "trigger_staff_count" AFTER INSERT OR DELETE OR UPDATE OF "is_active" ON "public"."staff" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_staff_count"();



ALTER TABLE ONLY "public"."admin_notes"
    ADD CONSTRAINT "admin_notes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_plan_changes"
    ADD CONSTRAINT "admin_plan_changes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_plan_changes"
    ADD CONSTRAINT "admin_plan_changes_new_plan_id_fkey" FOREIGN KEY ("new_plan_id") REFERENCES "public"."plans"("id");



ALTER TABLE ONLY "public"."admin_plan_changes"
    ADD CONSTRAINT "admin_plan_changes_old_plan_id_fkey" FOREIGN KEY ("old_plan_id") REFERENCES "public"."plans"("id");



ALTER TABLE ONLY "public"."admin_tags"
    ADD CONSTRAINT "admin_tags_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."availability"
    ADD CONSTRAINT "availability_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_addon_options"
    ADD CONSTRAINT "booking_addon_options_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."booking_addons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_addon_selections"
    ADD CONSTRAINT "booking_addon_selections_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."booking_addons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."booking_addon_selections"
    ADD CONSTRAINT "booking_addon_selections_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_addons"
    ADD CONSTRAINT "booking_addons_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."service_price_variants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_businesses"
    ADD CONSTRAINT "customer_businesses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_businesses"
    ADD CONSTRAINT "customer_businesses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_created_by_business_id_fkey" FOREIGN KEY ("created_by_business_id") REFERENCES "public"."businesses"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_history"
    ADD CONSTRAINT "payment_history_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_completed_by_user_id_fkey" FOREIGN KEY ("completed_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_completions"
    ADD CONSTRAINT "referral_completions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_completions"
    ADD CONSTRAINT "referral_completions_invitee_customer_id_fkey" FOREIGN KEY ("invitee_customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_completions"
    ADD CONSTRAINT "referral_completions_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_completions"
    ADD CONSTRAINT "referral_completions_referrer_customer_id_fkey" FOREIGN KEY ("referrer_customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."scan_logs"
    ADD CONSTRAINT "scan_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scan_logs"
    ADD CONSTRAINT "scan_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scan_logs"
    ADD CONSTRAINT "scan_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_addons"
    ADD CONSTRAINT "service_addons_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_addons"
    ADD CONSTRAINT "service_addons_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_price_variants"
    ADD CONSTRAINT "service_price_variants_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_questions"
    ADD CONSTRAINT "service_questions_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_invites"
    ADD CONSTRAINT "staff_invites_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_invites"
    ADD CONSTRAINT "staff_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."staff_services"
    ADD CONSTRAINT "staff_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_services"
    ADD CONSTRAINT "staff_services_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id");



ALTER TABLE ONLY "public"."usage_tracking"
    ADD CONSTRAINT "usage_tracking_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."verification_codes"
    ADD CONSTRAINT "verification_codes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_codes"
    ADD CONSTRAINT "verification_codes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can read all users" ON "public"."users" FOR SELECT TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."app_role"));



CREATE POLICY "Admins can update users" ON "public"."users" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."app_role"));



CREATE POLICY "Allow update for authenticated users" ON "public"."customers" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can read tier config" ON "public"."tier_config" FOR SELECT USING (true);



CREATE POLICY "Anyone can view active plans" ON "public"."plans" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Authenticated can read referral completions" ON "public"."referral_completions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated can view roles" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Business owners can delete own branches" ON "public"."branches" FOR DELETE USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can insert own branches" ON "public"."branches" FOR INSERT WITH CHECK (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can insert stock movements" ON "public"."stock_movements" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "stock_movements"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage all bookings" ON "public"."bookings" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "bookings"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage availability" ON "public"."availability" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "availability"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage staff services" ON "public"."staff_services" USING ((EXISTS ( SELECT 1
   FROM ("public"."staff"
     JOIN "public"."businesses" ON (("businesses"."id" = "staff"."business_id")))
  WHERE (("staff"."id" = "staff_services"."staff_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage their addon options" ON "public"."booking_addon_options" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."booking_addons" "a"
     JOIN "public"."businesses" "b" ON (("b"."id" = "a"."business_id")))
  WHERE (("a"."id" = "booking_addon_options"."addon_id") AND ("b"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."booking_addons" "a"
     JOIN "public"."businesses" "b" ON (("b"."id" = "a"."business_id")))
  WHERE (("a"."id" = "booking_addon_options"."addon_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage their addons" ON "public"."booking_addons" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "booking_addons"."business_id") AND ("businesses"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "booking_addons"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage their business" ON "public"."businesses" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Business owners can manage their products" ON "public"."products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "products"."business_id") AND ("businesses"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "products"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage their rewards" ON "public"."rewards" USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can manage their sales" ON "public"."sales" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "sales"."business_id") AND ("businesses"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "sales"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage their service addons" ON "public"."service_addons" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "service_addons"."business_id") AND ("businesses"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "service_addons"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage their service price variants" ON "public"."service_price_variants" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."businesses" "b" ON (("b"."id" = "s"."business_id")))
  WHERE (("s"."id" = "service_price_variants"."service_id") AND ("b"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."businesses" "b" ON (("b"."id" = "s"."business_id")))
  WHERE (("s"."id" = "service_price_variants"."service_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage their service questions" ON "public"."service_questions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."businesses" "b" ON (("b"."id" = "s"."business_id")))
  WHERE (("s"."id" = "service_questions"."service_id") AND ("b"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."businesses" "b" ON (("b"."id" = "s"."business_id")))
  WHERE (("s"."id" = "service_questions"."service_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can manage their services" ON "public"."services" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "services"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can read own audit logs" ON "public"."audit_logs" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can read own branches" ON "public"."branches" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can read own invoices" ON "public"."invoices" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can read own payments" ON "public"."payments" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can read own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can read own usage" ON "public"."usage_tracking" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can update own branches" ON "public"."branches" FOR UPDATE USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can view customer links" ON "public"."customer_businesses" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Business owners can view sale items" ON "public"."sale_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."sales"
     JOIN "public"."businesses" ON (("businesses"."id" = "sales"."business_id")))
  WHERE (("sales"."id" = "sale_items"."sale_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can view stock movements" ON "public"."stock_movements" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "stock_movements"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can view their booking addon selections" ON "public"."booking_addon_selections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."bookings"
     JOIN "public"."businesses" ON (("businesses"."id" = "bookings"."business_id")))
  WHERE (("bookings"."id" = "booking_addon_selections"."booking_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Business owners can view their customers" ON "public"."customers" FOR SELECT USING (("created_by_business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Businesses view own txns" ON "public"."transactions" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Customers can cancel their own bookings" ON "public"."bookings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."customers"
  WHERE (("customers"."id" = "bookings"."customer_id") AND ("customers"."user_id" = "auth"."uid"()))))) WITH CHECK (("status" = 'cancelled'::"public"."booking_status"));



CREATE POLICY "Customers can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK ((("customer_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."customers"
  WHERE (("customers"."id" = "bookings"."customer_id") AND ("customers"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Customers can manage their own record" ON "public"."customers" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Customers can read own data" ON "public"."customers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Customers can read own referral codes" ON "public"."referral_codes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Customers can view their own bookings" ON "public"."bookings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."customers"
  WHERE (("customers"."id" = "bookings"."customer_id") AND ("customers"."user_id" = "auth"."uid"())))));



CREATE POLICY "Customers view own" ON "public"."customers" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Customers view own txns" ON "public"."transactions" FOR SELECT USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Owners can view transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("business_id" IN ( SELECT "staff"."business_id"
   FROM "public"."staff"
  WHERE (("staff"."user_id" = "auth"."uid"()) AND ("staff"."role" = ANY (ARRAY['owner'::"public"."staff_role", 'manager'::"public"."staff_role"])) AND ("staff"."is_active" = true)))));



CREATE POLICY "Public can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can create customers" ON "public"."customers" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can link customers to businesses" ON "public"."customer_businesses" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can read active addon options" ON "public"."booking_addon_options" FOR SELECT TO "anon" USING (("is_active" = true));



CREATE POLICY "Public can read active addons" ON "public"."booking_addons" FOR SELECT TO "anon" USING (("is_active" = true));



CREATE POLICY "Public can read active service addons" ON "public"."service_addons" FOR SELECT TO "anon" USING (("is_active" = true));



CREATE POLICY "Public can read active service price variants" ON "public"."service_price_variants" FOR SELECT TO "anon" USING (("is_active" = true));



CREATE POLICY "Public can read service questions" ON "public"."service_questions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public can view active businesses" ON "public"."businesses" FOR SELECT TO "authenticated", "anon" USING (("subscription_status" = ANY (ARRAY['active'::"public"."subscription_status", 'trialing'::"public"."subscription_status"])));



CREATE POLICY "Public can view active rewards" ON "public"."rewards" FOR SELECT TO "authenticated", "anon" USING ((("is_active" = true) AND ("is_visible" = true) AND (("stock" IS NULL) OR ("stock" > 0)) AND (EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "rewards"."business_id") AND ("businesses"."subscription_status" = ANY (ARRAY['active'::"public"."subscription_status", 'trialing'::"public"."subscription_status"])))))));



CREATE POLICY "Public can view active services" ON "public"."services" FOR SELECT TO "authenticated", "anon" USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "services"."business_id") AND ("businesses"."subscription_status" = ANY (ARRAY['active'::"public"."subscription_status", 'trialing'::"public"."subscription_status"])))))));



CREATE POLICY "Public can view availability" ON "public"."availability" FOR SELECT USING (("is_available" = true));



CREATE POLICY "Public can view booking by code" ON "public"."bookings" FOR SELECT USING (true);



CREATE POLICY "Public can view business availability" ON "public"."availability" FOR SELECT TO "authenticated", "anon" USING ((("branch_id" IS NULL) AND ("staff_id" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "availability"."business_id") AND ("businesses"."subscription_status" = ANY (ARRAY['active'::"public"."subscription_status", 'trialing'::"public"."subscription_status"])))))));



CREATE POLICY "Public can view businesses" ON "public"."businesses" FOR SELECT USING (true);



CREATE POLICY "Public can view customer business links" ON "public"."customer_businesses" FOR SELECT USING (true);



CREATE POLICY "Public can view customer by card token" ON "public"."customers" FOR SELECT USING (("card_token" IS NOT NULL));



CREATE POLICY "Public can view staff service assignments" ON "public"."staff_services" FOR SELECT USING (true);



CREATE POLICY "Public view active rewards" ON "public"."rewards" FOR SELECT USING (("active" = true));



CREATE POLICY "Service role can manage email_queue" ON "public"."email_queue" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage rate_limits" ON "public"."rate_limits" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to booking_addon_options" ON "public"."booking_addon_options" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to booking_addon_selections" ON "public"."booking_addon_selections" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to booking_addons" ON "public"."booking_addons" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to products" ON "public"."products" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to sale_items" ON "public"."sale_items" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to sales" ON "public"."sales" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to service_addons" ON "public"."service_addons" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to service_price_variants" ON "public"."service_price_variants" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to service_questions" ON "public"."service_questions" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to stock_movements" ON "public"."stock_movements" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access" ON "public"."plans" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manages referral codes" ON "public"."referral_codes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role manages referral completions" ON "public"."referral_completions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Staff can create customers for their business" ON "public"."customers" FOR INSERT WITH CHECK (("created_by_staff_id" IN ( SELECT "staff"."id"
   FROM "public"."staff"
  WHERE (("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can create transactions" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (("business_id" IN ( SELECT "staff"."business_id"
   FROM "public"."staff"
  WHERE (("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can insert customers" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Staff can insert stock movements" ON "public"."stock_movements" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."business_id" = "stock_movements"."business_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can manage sale items" ON "public"."sale_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."sales"
     JOIN "public"."staff" ON (("staff"."business_id" = "sales"."business_id")))
  WHERE (("sales"."id" = "sale_items"."sale_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."sales"
     JOIN "public"."staff" ON (("staff"."business_id" = "sales"."business_id")))
  WHERE (("sales"."id" = "sale_items"."sale_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can manage sales" ON "public"."sales" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."business_id" = "sales"."business_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."business_id" = "sales"."business_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can manage their own availability" ON "public"."availability" USING ((("staff_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."id" = "availability"."staff_id") AND ("staff"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Staff can read addon options" ON "public"."booking_addon_options" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."booking_addons" "a"
     JOIN "public"."staff" "st" ON (("st"."business_id" = "a"."business_id")))
  WHERE (("a"."id" = "booking_addon_options"."addon_id") AND ("st"."user_id" = "auth"."uid"())))));



CREATE POLICY "Staff can read customers" ON "public"."customers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Staff can read customers they created" ON "public"."customers" FOR SELECT USING ((("created_by_business_id" IN ( SELECT "staff"."business_id"
   FROM "public"."staff"
  WHERE (("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Staff can read service price variants" ON "public"."service_price_variants" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."staff" "st" ON (("st"."business_id" = "s"."business_id")))
  WHERE (("s"."id" = "service_price_variants"."service_id") AND ("st"."user_id" = "auth"."uid"())))));



CREATE POLICY "Staff can read service questions" ON "public"."service_questions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."staff" "st" ON (("st"."business_id" = "s"."business_id")))
  WHERE (("s"."id" = "service_questions"."service_id") AND ("st"."user_id" = "auth"."uid"())))));



CREATE POLICY "Staff can update booking status" ON "public"."bookings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."business_id" = "bookings"."business_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can update customers" ON "public"."customers" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Staff can view business customers" ON "public"."customers" FOR SELECT USING (("created_by_business_id" IN ( SELECT "staff"."business_id"
   FROM "public"."staff"
  WHERE (("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can view business rewards" ON "public"."rewards" FOR SELECT USING (("business_id" IN ( SELECT "staff"."business_id"
   FROM "public"."staff"
  WHERE (("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can view customer links" ON "public"."customer_businesses" FOR SELECT USING (("business_id" IN ( SELECT "staff"."business_id"
   FROM "public"."staff"
  WHERE (("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can view products" ON "public"."products" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."business_id" = "products"."business_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can view stock movements" ON "public"."stock_movements" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."business_id" = "stock_movements"."business_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can view their business bookings" ON "public"."bookings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."business_id" = "bookings"."business_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can view their business services" ON "public"."services" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."business_id" = "services"."business_id") AND ("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true)))));



CREATE POLICY "Staff can view their own service assignments" ON "public"."staff_services" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."staff"
  WHERE (("staff"."id" = "staff_services"."staff_id") AND ("staff"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own business" ON "public"."businesses" FOR INSERT WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own customer record" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own business" ON "public"."businesses" FOR SELECT USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Users can read own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update own customer record" ON "public"."customers" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own customer record" ON "public"."customers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "customers"."user_id"
   FROM "public"."customers"
  WHERE ("customers"."id" = "transactions"."customer_id"))));



ALTER TABLE "public"."admin_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_plan_changes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anyone_can_view_visible_rewards" ON "public"."rewards" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND ("is_visible" = true)));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_select_own" ON "public"."audit_logs" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



ALTER TABLE "public"."availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_addon_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_addon_selections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_addons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "business_select_own_redemptions" ON "public"."redemptions" FOR SELECT USING ((("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))) OR ("business_id" IN ( SELECT "staff"."business_id"
   FROM "public"."staff"
  WHERE (("staff"."user_id" = "auth"."uid"()) AND ("staff"."is_active" = true))))));



ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "businesses_delete" ON "public"."businesses" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "businesses_insert" ON "public"."businesses" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "businesses_select" ON "public"."businesses" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "businesses_update" ON "public"."businesses" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



ALTER TABLE "public"."customer_businesses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_can_view_visible_rewards" ON "public"."rewards" FOR SELECT TO "authenticated" USING ((("is_active" = true) AND ("is_visible" = true)));



CREATE POLICY "customers_select_own_redemptions" ON "public"."redemptions" FOR SELECT USING (("customer_id" IN ( SELECT "customers"."id"
   FROM "public"."customers"
  WHERE ("customers"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."email_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."instruments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owners_full_access_rewards" ON "public"."rewards" TO "authenticated" USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"())))) WITH CHECK (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



ALTER TABLE "public"."payment_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_history_select_own" ON "public"."payment_history" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_can_view_visible_rewards" ON "public"."rewards" FOR SELECT TO "anon" USING ((("is_active" = true) AND ("is_visible" = true)));



ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."redemptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_completions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scan_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scan_logs_insert_verified" ON "public"."scan_logs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."staff" "s"
  WHERE (("s"."id" = "scan_logs"."staff_id") AND ("s"."user_id" = "auth"."uid"()) AND ("s"."is_active" = true) AND ("s"."email_verified_at" IS NOT NULL)))));



CREATE POLICY "scan_logs_select_own" ON "public"."scan_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."staff" "s"
  WHERE (("s"."id" = "scan_logs"."staff_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "scan_logs_select_owner" ON "public"."scan_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "scan_logs"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."service_addons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_price_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff_can_read_customers" ON "public"."customers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "staff_delete" ON "public"."staff" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "staff"."business_id") AND ("businesses"."owner_id" = "auth"."uid"())))));



CREATE POLICY "staff_insert" ON "public"."staff" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "staff"."business_id") AND ("businesses"."owner_id" = "auth"."uid"()))))));



ALTER TABLE "public"."staff_invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff_invites_insert" ON "public"."staff_invites" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "staff_invites"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "staff_invites_public_select" ON "public"."staff_invites" FOR SELECT USING (true);



CREATE POLICY "staff_invites_update" ON "public"."staff_invites" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "staff_invites"."business_id") AND ("b"."owner_id" = "auth"."uid"())))) OR ("status" = 'pending'::"text")));



CREATE POLICY "staff_select" ON "public"."staff" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "staff"."business_id") AND ("businesses"."owner_id" = "auth"."uid"()))))));



ALTER TABLE "public"."staff_services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff_update" ON "public"."staff" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."businesses"
  WHERE (("businesses"."id" = "staff"."business_id") AND ("businesses"."owner_id" = "auth"."uid"()))))));



ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_select_own" ON "public"."subscriptions" FOR SELECT USING (("business_id" IN ( SELECT "businesses"."id"
   FROM "public"."businesses"
  WHERE ("businesses"."owner_id" = "auth"."uid"()))));



ALTER TABLE "public"."tier_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_codes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."branches";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."businesses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customer_businesses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."email_queue";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."redemptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rewards";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."transactions";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."accept_staff_invite"("p_token" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_staff_invite"("p_token" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_staff_invite"("p_token" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_customer_points"("p_customer_id" "uuid", "p_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_customer_points"("p_customer_id" "uuid", "p_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_customer_points"("p_customer_id" "uuid", "p_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_plan_limit"("p_business_id" "uuid", "p_limit_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_plan_limit"("p_business_id" "uuid", "p_limit_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_plan_limit"("p_business_id" "uuid", "p_limit_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_identifier_type" "text", "p_action" "text", "p_max_requests" integer, "p_window_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_identifier_type" "text", "p_action" "text", "p_max_requests" integer, "p_window_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_identifier_type" "text", "p_action" "text", "p_max_requests" integer, "p_window_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_subscription_access"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_subscription_access"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_subscription_access"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_subscription_limit"("p_business_id" "uuid", "p_limit_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."check_subscription_limit"("p_business_id" "uuid", "p_limit_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_subscription_limit"("p_business_id" "uuid", "p_limit_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_verification_codes"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_verification_codes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_verification_codes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_redemption"("p_redemption_id" "uuid", "p_completed_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_redemption"("p_redemption_id" "uuid", "p_completed_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_redemption"("p_redemption_id" "uuid", "p_completed_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_referral"("p_referral_code" "text", "p_invitee_customer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_referral"("p_referral_code" "text", "p_invitee_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_referral"("p_referral_code" "text", "p_invitee_customer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_free_subscription_for_business"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_free_subscription_for_business"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_free_subscription_for_business"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrease_reward_stock"("p_reward_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrease_reward_stock"("p_reward_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrease_reward_stock"("p_reward_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_usage"("p_business_id" "uuid", "p_column" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_usage"("p_business_id" "uuid", "p_column" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_usage"("p_business_id" "uuid", "p_column" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_business_points"("p_customer_id" "uuid", "p_business_id" "uuid", "p_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_customer_points"("p_customer_id" "uuid", "p_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_customer_points"("p_customer_id" "uuid", "p_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_customer_points"("p_customer_id" "uuid", "p_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_or_create_customer_by_email"("p_email" "text", "p_full_name" "text", "p_phone" "text", "p_age" integer, "p_staff_id" "uuid", "p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."find_or_create_customer_by_email"("p_email" "text", "p_full_name" "text", "p_phone" "text", "p_age" integer, "p_staff_id" "uuid", "p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_or_create_customer_by_email"("p_email" "text", "p_full_name" "text", "p_phone" "text", "p_age" integer, "p_staff_id" "uuid", "p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_booking_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_booking_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_booking_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_business_slug"("business_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_business_slug"("business_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_business_slug"("business_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_sale_number"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_sale_number"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_sale_number"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_slug"("name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_business_activity_trend"("p_business_id" "uuid", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_business_activity_trend"("p_business_id" "uuid", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_business_activity_trend"("p_business_id" "uuid", "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_customer_tier"("p_lifetime_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_customer_tier"("p_lifetime_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_customer_tier"("p_lifetime_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invite_with_business"("p_token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_invite_with_business"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invite_with_business"("p_token" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_referral_code"("p_customer_id" "uuid", "p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_referral_code"("p_customer_id" "uuid", "p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_referral_code"("p_customer_id" "uuid", "p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_staff_by_user"("p_user_id" "uuid", "p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_staff_by_user"("p_user_id" "uuid", "p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_staff_by_user"("p_user_id" "uuid", "p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_staff_today_stats"("p_staff_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_staff_today_stats"("p_staff_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_staff_today_stats"("p_staff_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tier_multiplier"("p_tier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tier_multiplier"("p_tier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tier_multiplier"("p_tier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_staff_info"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_staff_info"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_staff_info"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_staff_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_staff_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_staff_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_users_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_users_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_users_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_usage"("p_business_id" "uuid", "p_column" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_usage"("p_business_id" "uuid", "p_column" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_usage"("p_business_id" "uuid", "p_column" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_staff_record"("p_user_id" "uuid", "p_business_id" "uuid", "p_role" "text", "p_name" "text", "p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_staff_record"("p_user_id" "uuid", "p_business_id" "uuid", "p_role" "text", "p_name" "text", "p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_staff_record"("p_user_id" "uuid", "p_business_id" "uuid", "p_role" "text", "p_name" "text", "p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."link_oauth_to_customer"("p_user_id" "uuid", "p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."link_oauth_to_customer"("p_user_id" "uuid", "p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_oauth_to_customer"("p_user_id" "uuid", "p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."link_oauth_to_customer_by_phone"("p_user_id" "uuid", "p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."link_oauth_to_customer_by_phone"("p_user_id" "uuid", "p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_oauth_to_customer_by_phone"("p_user_id" "uuid", "p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."lookup_customer_by_qr"("p_scanned_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."lookup_customer_by_qr"("p_scanned_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lookup_customer_by_qr"("p_scanned_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_usage_counts"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_usage_counts"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_usage_counts"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_customer_scan"("p_staff_id" "uuid", "p_customer_id" "uuid", "p_points" integer, "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."record_customer_scan"("p_staff_id" "uuid", "p_customer_id" "uuid", "p_points" integer, "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_customer_scan"("p_staff_id" "uuid", "p_customer_id" "uuid", "p_points" integer, "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."redeem_reward"("p_customer_id" "uuid", "p_reward_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_reward"("p_customer_id" "uuid", "p_reward_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_reward"("p_customer_id" "uuid", "p_reward_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_customer_for_business"("p_scanned_code" "text", "p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_customer_for_business"("p_scanned_code" "text", "p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_customer_for_business"("p_scanned_code" "text", "p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_booking_confirmation_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_booking_confirmation_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_booking_confirmation_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_business_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_business_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_business_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_auto_link_customer_business"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_auto_link_customer_business"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_auto_link_customer_business"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_auto_link_customer_by_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_auto_link_customer_by_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_auto_link_customer_by_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_branch_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_branch_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_branch_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_customer_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_customer_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_customer_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_staff_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_staff_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_staff_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_booking_addon_options_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_booking_addon_options_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_booking_addon_options_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_booking_addons_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_booking_addons_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_booking_addons_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customer_tier"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_customer_tier"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customer_tier"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sales_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sales_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sales_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_service_addons_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_service_addons_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_service_addons_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_service_price_variants_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_service_price_variants_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_service_price_variants_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_service_questions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_service_questions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_service_questions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_staff_last_login"("p_staff_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_staff_last_login"("p_staff_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_staff_last_login"("p_staff_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_usage_counts"("p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_usage_counts"("p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_usage_counts"("p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_customer_otp"("p_code" "text", "p_email" "text", "p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_customer_otp"("p_code" "text", "p_email" "text", "p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_customer_otp"("p_code" "text", "p_email" "text", "p_business_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_redemption_code"("p_code" "text", "p_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_redemption_code"("p_code" "text", "p_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_redemption_code"("p_code" "text", "p_business_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."branches" TO "anon";
GRANT ALL ON TABLE "public"."branches" TO "authenticated";
GRANT ALL ON TABLE "public"."branches" TO "service_role";



GRANT ALL ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT ALL ON TABLE "public"."customer_businesses" TO "anon";
GRANT ALL ON TABLE "public"."customer_businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_businesses" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."staff" TO "anon";
GRANT ALL ON TABLE "public"."staff" TO "authenticated";
GRANT ALL ON TABLE "public"."staff" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_business_stats" TO "anon";
GRANT ALL ON TABLE "public"."admin_business_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_business_stats" TO "service_role";



GRANT ALL ON TABLE "public"."admin_notes" TO "anon";
GRANT ALL ON TABLE "public"."admin_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_notes" TO "service_role";



GRANT ALL ON TABLE "public"."admin_plan_changes" TO "anon";
GRANT ALL ON TABLE "public"."admin_plan_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_plan_changes" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."admin_platform_stats" TO "anon";
GRANT ALL ON TABLE "public"."admin_platform_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_platform_stats" TO "service_role";



GRANT ALL ON TABLE "public"."admin_tags" TO "anon";
GRANT ALL ON TABLE "public"."admin_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_tags" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."availability" TO "anon";
GRANT ALL ON TABLE "public"."availability" TO "authenticated";
GRANT ALL ON TABLE "public"."availability" TO "service_role";



GRANT ALL ON TABLE "public"."booking_addon_options" TO "anon";
GRANT ALL ON TABLE "public"."booking_addon_options" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_addon_options" TO "service_role";



GRANT ALL ON TABLE "public"."booking_addon_selections" TO "anon";
GRANT ALL ON TABLE "public"."booking_addon_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_addon_selections" TO "service_role";



GRANT ALL ON TABLE "public"."booking_addons" TO "anon";
GRANT ALL ON TABLE "public"."booking_addons" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_addons" TO "service_role";



GRANT ALL ON TABLE "public"."email_queue" TO "anon";
GRANT ALL ON TABLE "public"."email_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."email_queue" TO "service_role";



GRANT ALL ON TABLE "public"."instruments" TO "anon";
GRANT ALL ON TABLE "public"."instruments" TO "authenticated";
GRANT ALL ON TABLE "public"."instruments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."instruments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."instruments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."instruments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."payment_history" TO "anon";
GRANT ALL ON TABLE "public"."payment_history" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_history" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."redemptions" TO "anon";
GRANT ALL ON TABLE "public"."redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."redemptions" TO "service_role";



GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_codes" TO "service_role";



GRANT ALL ON TABLE "public"."referral_completions" TO "anon";
GRANT ALL ON TABLE "public"."referral_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_completions" TO "service_role";



GRANT ALL ON TABLE "public"."rewards" TO "anon";
GRANT ALL ON TABLE "public"."rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."sale_items" TO "anon";
GRANT ALL ON TABLE "public"."sale_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON TABLE "public"."scan_logs" TO "anon";
GRANT ALL ON TABLE "public"."scan_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."scan_logs" TO "service_role";



GRANT ALL ON TABLE "public"."service_addons" TO "anon";
GRANT ALL ON TABLE "public"."service_addons" TO "authenticated";
GRANT ALL ON TABLE "public"."service_addons" TO "service_role";



GRANT ALL ON TABLE "public"."service_price_variants" TO "anon";
GRANT ALL ON TABLE "public"."service_price_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."service_price_variants" TO "service_role";



GRANT ALL ON TABLE "public"."service_questions" TO "anon";
GRANT ALL ON TABLE "public"."service_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."service_questions" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."staff_invites" TO "anon";
GRANT ALL ON TABLE "public"."staff_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_invites" TO "service_role";



GRANT ALL ON TABLE "public"."staff_services" TO "anon";
GRANT ALL ON TABLE "public"."staff_services" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_services" TO "service_role";



GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



GRANT ALL ON TABLE "public"."tier_config" TO "anon";
GRANT ALL ON TABLE "public"."tier_config" TO "authenticated";
GRANT ALL ON TABLE "public"."tier_config" TO "service_role";



GRANT ALL ON TABLE "public"."usage_tracking" TO "anon";
GRANT ALL ON TABLE "public"."usage_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."verification_codes" TO "anon";
GRANT ALL ON TABLE "public"."verification_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_codes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































