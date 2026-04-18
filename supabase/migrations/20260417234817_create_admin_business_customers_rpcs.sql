CREATE OR REPLACE FUNCTION public.admin_list_business_customers(
  p_business_id uuid,
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 25,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  customer_id uuid,
  email text,
  phone text,
  points integer,
  followed_at timestamptz,
  transaction_count bigint,
  last_transaction_at timestamptz,
  total_count bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH filtered AS (
    SELECT
      c.id AS customer_id,
      c.email,
      c.phone,
      cb.points,
      cb.followed_at
    FROM public.customer_businesses cb
    JOIN public.customers c ON c.id = cb.customer_id
    WHERE cb.business_id = p_business_id
      AND (
        p_search IS NULL OR p_search = ''
        OR c.email ILIKE '%' || p_search || '%'
        OR c.phone ILIKE '%' || p_search || '%'
      )
  ),
  counted AS (
    SELECT *, COUNT(*) OVER () AS total_count FROM filtered
  )
  SELECT
    c.customer_id,
    c.email,
    c.phone,
    c.points,
    c.followed_at,
    COALESCE((
      SELECT count(*)
      FROM public.transactions t
      WHERE t.business_id = p_business_id AND t.customer_id = c.customer_id
    ), 0) AS transaction_count,
    (
      SELECT max(t.created_at)
      FROM public.transactions t
      WHERE t.business_id = p_business_id AND t.customer_id = c.customer_id
    ) AS last_transaction_at,
    c.total_count
  FROM counted c
  ORDER BY c.followed_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset);
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_business_customers(uuid, text, int, int) TO service_role;

-- Single-customer detail for admin view (server-side read-only)
CREATE OR REPLACE FUNCTION public.admin_get_customer_detail(p_customer_id uuid)
RETURNS TABLE (
  customer_id uuid,
  email text,
  phone text,
  memberships jsonb,
  recent_transactions jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.email,
    c.phone,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'business_id', b.id,
        'business_name', b.name,
        'points', cb.points,
        'followed_at', cb.followed_at
      ) ORDER BY cb.followed_at DESC)
      FROM public.customer_businesses cb
      JOIN public.businesses b ON b.id = cb.business_id
      WHERE cb.customer_id = c.id
    ), '[]'::jsonb) AS memberships,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id,
        'business_id', t.business_id,
        'business_name', b.name,
        'type', t.type,
        'points', t.points,
        'created_at', t.created_at
      ) ORDER BY t.created_at DESC)
      FROM (
        SELECT * FROM public.transactions
        WHERE customer_id = c.id
        ORDER BY created_at DESC
        LIMIT 50
      ) t
      LEFT JOIN public.businesses b ON b.id = t.business_id
    ), '[]'::jsonb) AS recent_transactions
  FROM public.customers c
  WHERE c.id = p_customer_id;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_customer_detail(uuid) TO service_role;
