-- ============================================
-- Admin Dashboard: Views & Tables
-- ============================================

-- Platform-wide aggregate stats (single row)
CREATE OR REPLACE VIEW admin_platform_stats AS
SELECT
  (SELECT count(*) FROM businesses) AS total_businesses,
  (SELECT count(*) FROM businesses WHERE created_at >= now() - interval '30 days') AS businesses_30d,
  (SELECT count(*) FROM customers) AS total_customers,
  (SELECT count(*) FROM customers WHERE created_at >= now() - interval '30 days') AS customers_30d,
  (SELECT count(*) FROM transactions) AS total_transactions,
  (SELECT count(*) FROM transactions WHERE created_at >= now() - interval '30 days') AS transactions_30d,
  (SELECT count(*) FROM subscriptions WHERE status = 'active') AS active_subscriptions;

-- Per-business stats
CREATE OR REPLACE VIEW admin_business_stats AS
SELECT
  b.id,
  b.name,
  b.slug,
  b.owner_email,
  b.created_at,
  b.subscription_status,
  p.display_name AS plan_name,
  (SELECT count(*) FROM customer_businesses cb WHERE cb.business_id = b.id) AS customer_count,
  (SELECT count(*) FROM staff s WHERE s.business_id = b.id AND s.is_active = true) AS staff_count,
  (SELECT count(*) FROM transactions t WHERE t.business_id = b.id) AS transaction_count,
  (SELECT count(*) FROM transactions t WHERE t.business_id = b.id AND t.created_at >= now() - interval '30 days') AS transactions_30d
FROM businesses b
LEFT JOIN subscriptions sub ON sub.business_id = b.id
LEFT JOIN plans p ON p.id = sub.plan_id;

-- ============================================
-- Admin-only tables (RLS enabled, zero policies = service role only)
-- ============================================

-- Internal notes on businesses
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Tags for businesses
CREATE TABLE IF NOT EXISTS admin_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, tag)
);

ALTER TABLE admin_tags ENABLE ROW LEVEL SECURITY;

-- Audit log for admin-initiated plan changes
CREATE TABLE IF NOT EXISTS admin_plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  changed_by_email TEXT NOT NULL,
  old_plan_id UUID REFERENCES plans(id),
  new_plan_id UUID REFERENCES plans(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_plan_changes ENABLE ROW LEVEL SECURITY;
