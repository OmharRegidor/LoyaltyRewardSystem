-- Fix double-counted per-business points
-- The trg_auto_link_customer_business trigger already updates customer_businesses.points
-- on transaction insert, but an explicit add_business_points RPC was also being called,
-- causing points to be counted twice. This migration recalculates all balances from
-- the transactions ledger (single source of truth).

UPDATE customer_businesses cb
SET points = COALESCE((
  SELECT SUM(
    CASE WHEN t.type = 'earn' THEN t.points ELSE -t.points END
  )
  FROM transactions t
  WHERE t.customer_id = cb.customer_id
    AND t.business_id = cb.business_id
), 0);
