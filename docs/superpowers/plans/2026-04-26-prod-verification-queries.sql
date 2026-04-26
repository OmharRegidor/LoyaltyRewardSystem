-- Run these in Supabase Studio SQL Editor (prod project: vcddpimnbcsojztbyaso)
-- AFTER `supabase db push --linked` completes.
-- Each block has an `expected:` comment. If any actual differs, stop and report.

-- ============================================
-- A. add_stamp must have exactly one overload
-- ============================================
SELECT oid::regprocedure::text AS signature
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE proname = 'add_stamp' AND nspname = 'public';
-- expected: 1 row, "add_stamp(uuid,uuid,uuid,uuid,text,text)"

-- ============================================
-- B. New transactions columns exist
-- ============================================
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='transactions'
   AND column_name IN ('sale_id','stamps_added')
 ORDER BY column_name;
-- expected: 2 rows: sale_id, stamps_added

-- ============================================
-- C. Every customer-linked completed sale has a transactions row
-- ============================================
SELECT COUNT(*) AS unlinked_sales
  FROM pos_sales ps
 WHERE ps.customer_id IS NOT NULL
   AND ps.status = 'completed'
   AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.sale_id = ps.id);
-- expected: 0

-- ============================================
-- D. Stamp entries with sale_id are reflected on transactions
-- ============================================
SELECT
  (SELECT COUNT(*) FROM stamp_entries WHERE is_undone=false AND sale_id IS NOT NULL) AS expected_stamp_count,
  COALESCE((SELECT SUM(stamps_added) FROM transactions WHERE sale_id IS NOT NULL), 0) AS actual_stamp_count;
-- expected: actual_stamp_count >= expected_stamp_count

-- ============================================
-- E. Quick stamps got their own transaction rows
-- ============================================
SELECT
  (SELECT COUNT(*) FROM stamp_entries WHERE is_undone=false AND sale_id IS NULL) AS quick_stamps_in_db,
  (SELECT COUNT(*) FROM transactions WHERE stamps_added > 0 AND sale_id IS NULL) AS quick_stamps_in_wallet;
-- expected: quick_stamps_in_wallet >= quick_stamps_in_db

-- ============================================
-- F. New impersonation tables exist
-- ============================================
SELECT table_name FROM information_schema.tables
 WHERE table_schema='public' AND table_name LIKE 'impersonation%'
 ORDER BY table_name;
-- expected: at least: impersonation_sessions

-- ============================================
-- G. New admin RPCs exist and are callable
-- ============================================
SELECT proname FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname='public'
   AND proname IN (
     'sum_business_points_30d',
     'delete_business',
     'admin_enterprise_accounts',
     'admin_list_users'
   )
 ORDER BY proname;
-- expected: 4 rows
