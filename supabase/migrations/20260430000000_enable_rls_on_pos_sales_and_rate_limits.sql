-- Enable Row-Level Security on tables that were missing it.
--
-- Supabase's security advisor flagged these as `rls_disabled_in_public`,
-- meaning anyone with the project URL + anon key (which is shipped in the
-- mobile/web bundle, so effectively public) could read, edit, and delete
-- every row.
--
-- pos_sales: created in 20260411091628_create_pos_sales_table without RLS,
--            inheriting dev's misconfiguration. Mirror the policies from
--            the legacy `sales` table so owners + active staff can manage
--            their own business's sales while service_role retains full
--            access for SECURITY DEFINER RPCs (process_staff_sale, etc.).
--
-- rate_limits: internal table touched only by middleware via service_role.
--              Anon/authenticated users have no business reading or writing
--              it. Service_role bypasses RLS, so no public policies needed.

-- ============================================
-- 1. pos_sales
-- ============================================

ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to pos_sales" ON public.pos_sales;
CREATE POLICY "Service role full access to pos_sales" ON public.pos_sales
  AS PERMISSIVE FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Business owners can manage their pos_sales" ON public.pos_sales;
CREATE POLICY "Business owners can manage their pos_sales" ON public.pos_sales
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = pos_sales.business_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = pos_sales.business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can manage pos_sales" ON public.pos_sales;
CREATE POLICY "Staff can manage pos_sales" ON public.pos_sales
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.business_id = pos_sales.business_id
        AND s.user_id = auth.uid()
        AND s.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.business_id = pos_sales.business_id
        AND s.user_id = auth.uid()
        AND s.is_active = true
    )
  );

-- ============================================
-- 2. rate_limits
-- ============================================
-- Conditional: dev has this table (used by middleware), prod may not yet.
-- No public policies. Only service_role can touch this table.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rate_limits'
  ) THEN
    EXECUTE 'ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY';
  END IF;
END;
$$;
