-- Backfill customer names from Google OAuth metadata.
-- Fixes customers who signed up via mobile app where a JS operator precedence
-- bug caused full_name to be stored as NULL.
UPDATE public.customers c
SET full_name = COALESCE(
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'name',
  NULLIF(TRIM(
    COALESCE(au.raw_user_meta_data->>'given_name', '') || ' ' ||
    COALESCE(au.raw_user_meta_data->>'family_name', '')
  ), '')
)
FROM auth.users au
WHERE c.user_id = au.id
  AND c.full_name IS NULL
  AND au.raw_user_meta_data IS NOT NULL;
