CREATE OR REPLACE FUNCTION public.get_admin_business_facets()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'plans',
    COALESCE((
      SELECT jsonb_object_agg(plan_key, plan_count)
      FROM (
        SELECT COALESCE(p.display_name, 'free') AS plan_key, count(*) AS plan_count
        FROM public.businesses b
        LEFT JOIN public.subscriptions s ON s.business_id = b.id
        LEFT JOIN public.plans p ON p.id = s.plan_id
        GROUP BY COALESCE(p.display_name, 'free')
      ) x
    ), '{}'::jsonb),
    'types',
    COALESCE((
      SELECT jsonb_object_agg(business_type, type_count)
      FROM (
        SELECT business_type, count(*) AS type_count
        FROM public.businesses
        WHERE business_type IS NOT NULL
        GROUP BY business_type
      ) x
    ), '{}'::jsonb),
    'statuses',
    COALESCE((
      SELECT jsonb_object_agg(subscription_status, status_count)
      FROM (
        SELECT subscription_status, count(*) AS status_count
        FROM public.businesses
        GROUP BY subscription_status
      ) x
    ), '{}'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_business_facets() TO service_role;

CREATE OR REPLACE FUNCTION public.get_audit_event_types()
RETURNS text[]
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(array_agg(event_type ORDER BY event_type), ARRAY[]::text[])
  FROM (
    SELECT DISTINCT event_type
    FROM public.audit_logs
    WHERE event_type IS NOT NULL
  ) x;
$$;

GRANT EXECUTE ON FUNCTION public.get_audit_event_types() TO service_role;
