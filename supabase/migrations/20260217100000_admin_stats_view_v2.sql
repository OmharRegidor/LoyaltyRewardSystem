-- ============================================
-- Admin Dashboard: Enhanced Platform Stats View
-- ============================================

DROP VIEW IF EXISTS admin_platform_stats;

CREATE VIEW admin_platform_stats AS
SELECT
  (SELECT count(*) FROM businesses) AS total_businesses,
  (SELECT count(*) FROM businesses WHERE created_at >= now() - interval '30 days') AS businesses_30d,
  (SELECT count(*) FROM businesses WHERE created_at >= now() - interval '7 days') AS businesses_7d,
  (SELECT count(*) FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE p.name = 'enterprise' AND s.status = 'active') AS enterprise_count,
  (SELECT count(*) FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE p.name = 'free' AND s.status = 'active') AS free_count,
  (SELECT count(*) FROM customers) AS total_customers,
  (SELECT count(*) FROM customers WHERE created_at >= now() - interval '30 days') AS customers_30d,
  (SELECT count(*) FROM transactions) AS total_transactions,
  (SELECT count(*) FROM transactions WHERE created_at >= now() - interval '30 days') AS transactions_30d,
  (SELECT coalesce(sum(points), 0) FROM transactions WHERE type = 'earn') AS total_points_issued,
  (SELECT coalesce(sum(points), 0) FROM transactions WHERE type = 'earn' AND created_at >= now() - interval '30 days') AS points_issued_30d,
  (SELECT count(*) FROM bookings) AS total_bookings,
  (SELECT count(*) FROM bookings WHERE created_at >= now() - interval '30 days') AS bookings_30d,
  (SELECT count(*) FROM subscriptions WHERE status = 'active') AS active_subscriptions;
