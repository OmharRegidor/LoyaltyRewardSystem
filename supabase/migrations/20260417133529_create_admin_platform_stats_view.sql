CREATE OR REPLACE VIEW public.admin_platform_stats AS
SELECT
  (SELECT count(*) FROM public.businesses) AS total_businesses,
  (SELECT count(*) FROM public.businesses WHERE created_at >= now() - interval '30 days') AS businesses_30d,
  (SELECT count(*) FROM public.businesses WHERE created_at >= now() - interval '7 days') AS businesses_7d,
  (SELECT count(*) FROM public.subscriptions s JOIN public.plans p ON p.id = s.plan_id WHERE p.name::text = 'enterprise' AND s.status::text = 'active') AS enterprise_count,
  (SELECT count(*) FROM public.subscriptions s JOIN public.plans p ON p.id = s.plan_id WHERE p.name::text = 'free' AND s.status::text = 'active') AS free_count,
  (SELECT count(*) FROM public.customers) AS total_customers,
  (SELECT count(*) FROM public.customers WHERE created_at >= now() - interval '30 days') AS customers_30d,
  (SELECT count(*) FROM public.transactions) AS total_transactions,
  (SELECT count(*) FROM public.transactions WHERE created_at >= now() - interval '30 days') AS transactions_30d,
  (SELECT COALESCE(sum(points), 0)::bigint FROM public.transactions WHERE type = 'earn'::public.transaction_type) AS total_points_issued,
  (SELECT COALESCE(sum(points), 0)::bigint FROM public.transactions WHERE type = 'earn'::public.transaction_type AND created_at >= now() - interval '30 days') AS points_issued_30d,
  0::bigint AS total_bookings,
  0::bigint AS bookings_30d,
  (SELECT count(*) FROM public.subscriptions WHERE status::text = 'active') AS active_subscriptions;

ALTER VIEW public.admin_platform_stats OWNER TO postgres;

GRANT ALL ON TABLE public.admin_platform_stats TO anon;
GRANT ALL ON TABLE public.admin_platform_stats TO authenticated;
GRANT ALL ON TABLE public.admin_platform_stats TO service_role;
