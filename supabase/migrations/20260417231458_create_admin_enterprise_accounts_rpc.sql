CREATE OR REPLACE FUNCTION public.admin_list_enterprise_accounts()
RETURNS TABLE (
  subscription_id uuid,
  business_id uuid,
  business_name text,
  owner_email text,
  plan_name text,
  plan_display_name text,
  has_pos boolean,
  upgraded_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  WITH ent_plan AS (
    SELECT id, display_name, has_pos
    FROM public.plans
    WHERE name = 'enterprise'
    LIMIT 1
  ),
  latest_change AS (
    SELECT DISTINCT ON (business_id)
      business_id,
      created_at
    FROM public.admin_plan_changes, ent_plan
    WHERE new_plan_id = ent_plan.id
    ORDER BY business_id, created_at DESC
  )
  SELECT
    s.id AS subscription_id,
    s.business_id,
    b.name AS business_name,
    b.owner_email,
    'enterprise'::text AS plan_name,
    ent_plan.display_name AS plan_display_name,
    COALESCE(s.module_pos_override, ent_plan.has_pos, false) AS has_pos,
    COALESCE(lc.created_at, s.updated_at) AS upgraded_at
  FROM public.subscriptions s
  JOIN ent_plan ON s.plan_id = ent_plan.id
  JOIN public.businesses b ON b.id = s.business_id
  LEFT JOIN latest_change lc ON lc.business_id = s.business_id
  WHERE s.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_enterprise_accounts() TO service_role;
