CREATE OR REPLACE VIEW public.admin_business_stats AS
SELECT
  b.id,
  b.name,
  b.slug,
  b.owner_email,
  b.created_at,
  b.subscription_status,
  b.business_type,
  b.phone,
  p.display_name AS plan_name,
  COALESCE(cb.cnt, 0) AS customer_count,
  COALESCE(st.cnt, 0) AS staff_count,
  COALESCE(tx.total_cnt, 0) AS transaction_count,
  COALESCE(tx.cnt_30d, 0) AS transactions_30d,
  COALESCE(br.cnt, 0) AS branch_count,
  COALESCE(pts.total, 0::bigint) AS points_issued,
  tx.last_at AS last_active_at
FROM businesses b
LEFT JOIN subscriptions sub ON sub.business_id = b.id
LEFT JOIN plans p ON p.id = sub.plan_id
LEFT JOIN LATERAL (
  SELECT count(*) AS cnt
  FROM customer_businesses
  WHERE business_id = b.id
) cb ON true
LEFT JOIN LATERAL (
  SELECT count(*) AS cnt
  FROM staff
  WHERE business_id = b.id AND is_active = true
) st ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) AS total_cnt,
    count(*) FILTER (WHERE created_at >= now() - interval '30 days') AS cnt_30d,
    max(created_at) AS last_at
  FROM transactions
  WHERE business_id = b.id
) tx ON true
LEFT JOIN LATERAL (
  SELECT count(*) AS cnt
  FROM branches
  WHERE business_id = b.id AND is_active = true
) br ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(sum(points), 0::bigint) AS total
  FROM transactions
  WHERE business_id = b.id AND type = 'earn'::transaction_type
) pts ON true;

ALTER VIEW public.admin_business_stats OWNER TO postgres;
GRANT ALL ON TABLE public.admin_business_stats TO anon;
GRANT ALL ON TABLE public.admin_business_stats TO authenticated;
GRANT ALL ON TABLE public.admin_business_stats TO service_role;
