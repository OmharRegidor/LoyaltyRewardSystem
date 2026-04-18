CREATE INDEX IF NOT EXISTS idx_admin_plan_changes_business_id
  ON public.admin_plan_changes(business_id);

CREATE INDEX IF NOT EXISTS idx_admin_plan_changes_created_at
  ON public.admin_plan_changes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_plan_changes_new_plan
  ON public.admin_plan_changes(new_plan_id, business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manual_invoices_created_at
  ON public.manual_invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status_created
  ON public.upgrade_requests(status, created_at DESC);
