-- ============================================
-- RPC: get_business_activity_trend
-- Returns daily transactions, new customers, and points earned
-- for a given business over the last N days.
-- ============================================

CREATE OR REPLACE FUNCTION get_business_activity_trend(
  p_business_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (day DATE, transactions BIGINT, new_customers BIGINT, points_earned BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
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
