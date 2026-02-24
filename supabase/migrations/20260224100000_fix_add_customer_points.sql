-- Fix: add_customer_points was not incrementing lifetime_points
-- This caused the mobile app's BalanceCard to show stale lifetime points
-- Also triggers the existing customer_tier_update trigger for auto tier recalculation

CREATE OR REPLACE FUNCTION "public"."add_customer_points"("p_customer_id" "uuid", "p_points" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE customers
  SET total_points = total_points + p_points,
      lifetime_points = lifetime_points + p_points,
      last_visit = NOW()
  WHERE id = p_customer_id;
END;
$$;
