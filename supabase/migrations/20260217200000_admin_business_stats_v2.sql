-- ============================================
-- Admin Dashboard: Extended Business Stats View
-- Adds: business_type, phone, branch_count, points_issued, last_active_at
-- ============================================

DROP VIEW IF EXISTS admin_business_stats;

CREATE VIEW admin_business_stats AS
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
  (SELECT count(*) FROM customer_businesses cb WHERE cb.business_id = b.id) AS customer_count,
  (SELECT count(*) FROM staff s WHERE s.business_id = b.id AND s.is_active = true) AS staff_count,
  (SELECT count(*) FROM transactions t WHERE t.business_id = b.id) AS transaction_count,
  (SELECT count(*) FROM transactions t WHERE t.business_id = b.id AND t.created_at >= now() - interval '30 days') AS transactions_30d,
  (SELECT count(*) FROM branches br WHERE br.business_id = b.id AND br.is_active = true) AS branch_count,
  (SELECT coalesce(sum(t.points), 0) FROM transactions t WHERE t.business_id = b.id AND t.type = 'earn') AS points_issued,
  (SELECT max(t.created_at) FROM transactions t WHERE t.business_id = b.id) AS last_active_at
FROM businesses b
LEFT JOIN subscriptions sub ON sub.business_id = b.id
LEFT JOIN plans p ON p.id = sub.plan_id;
