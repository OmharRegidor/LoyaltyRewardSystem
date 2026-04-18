CREATE OR REPLACE FUNCTION public.sum_business_points_30d(p_business_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(sum(points), 0)::bigint
  FROM public.transactions
  WHERE business_id = p_business_id
    AND type = 'earn'::transaction_type
    AND created_at >= now() - interval '30 days';
$$;

GRANT EXECUTE ON FUNCTION public.sum_business_points_30d(uuid) TO service_role;
