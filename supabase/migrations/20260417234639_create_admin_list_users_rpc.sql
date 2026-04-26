CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_role text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 25,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  created_at timestamptz,
  business_id uuid,
  business_name text,
  business_count integer,
  total_count bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH ranked AS (
    SELECT
      u.id AS user_id,
      u.email,
      r.name::text AS role,
      u.created_at,
      CASE
        WHEN r.name::text = 'business_owner' THEN (SELECT b.id FROM public.businesses b WHERE b.owner_id = u.id LIMIT 1)
        WHEN r.name::text = 'staff' THEN (SELECT st.business_id FROM public.staff st WHERE st.user_id = u.id AND st.is_active = true LIMIT 1)
        ELSE NULL
      END AS business_id,
      CASE
        WHEN r.name::text = 'business_owner' THEN (
          SELECT count(*)::int FROM public.businesses b WHERE b.owner_id = u.id
        )
        WHEN r.name::text = 'staff' THEN (
          SELECT count(*)::int FROM public.staff st WHERE st.user_id = u.id AND st.is_active = true
        )
        ELSE 0
      END AS business_count
    FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE (p_role IS NULL OR r.name::text = p_role)
      AND (
        p_search IS NULL OR p_search = ''
        OR u.email ILIKE '%' || p_search || '%'
      )
  ),
  counted AS (
    SELECT *, COUNT(*) OVER () AS total_count FROM ranked
  )
  SELECT
    c.user_id,
    c.email,
    c.role,
    c.created_at,
    c.business_id,
    (SELECT b.name FROM public.businesses b WHERE b.id = c.business_id) AS business_name,
    c.business_count,
    c.total_count
  FROM counted c
  ORDER BY c.created_at DESC NULLS LAST, c.email
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset);
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users(text, text, int, int) TO service_role;
