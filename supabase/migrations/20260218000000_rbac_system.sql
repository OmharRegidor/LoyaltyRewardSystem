-- ============================================
-- RBAC System: roles, users, triggers, backfill
-- ============================================

-- 1a. app_role enum + roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'business_owner', 'staff', 'customer');

CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name public.app_role NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Platform administrator with full access'),
  ('business_owner', 'Business owner with dashboard access'),
  ('staff', 'Staff member with scanner/POS access'),
  ('customer', 'Mobile app customer');

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view roles" ON public.roles
  FOR SELECT TO authenticated USING (true);

-- 1b. users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_users_role_id ON public.users(role_id);
CREATE INDEX idx_users_email ON public.users(email);

-- 1c. get_user_role() SECURITY DEFINER function
-- Avoids self-referencing RLS on public.users
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  SELECT r.name INTO v_role
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = p_user_id;

  RETURN COALESCE(v_role, 'customer');
END;
$$;

-- 1d. RLS policies for users
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 1e. Auth trigger: auto-create public.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_name public.app_role;
  v_role_id UUID;
BEGIN
  -- Read role from user metadata (set during signup)
  v_role_name := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'customer'
  );

  SELECT id INTO v_role_id FROM public.roles WHERE name = v_role_name;

  -- Fallback to customer if role not found
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'customer';
  END IF;

  INSERT INTO public.users (id, role_id, email)
  VALUES (NEW.id, v_role_id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 1f. Staff sync trigger
-- When a staff record is inserted/activated, upsert public.users with staff role
-- Won't downgrade existing business_owner or admin
CREATE OR REPLACE FUNCTION public.handle_staff_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_role_id UUID;
  v_current_role public.app_role;
BEGIN
  -- Only act on active staff with a user_id
  IF NEW.user_id IS NULL OR NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_staff_role_id FROM public.roles WHERE name = 'staff';

  -- Check current role (don't downgrade admin or business_owner)
  SELECT r.name INTO v_current_role
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.id = NEW.user_id;

  IF v_current_role IN ('admin', 'business_owner') THEN
    RETURN NEW;
  END IF;

  -- Upsert with staff role
  INSERT INTO public.users (id, role_id, email)
  VALUES (NEW.user_id, v_staff_role_id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    role_id = v_staff_role_id,
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_staff_created_or_updated
  AFTER INSERT OR UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_staff_sync();

-- 1g. Backfill existing users (highest privilege first, ON CONFLICT DO NOTHING)

-- Business owners
INSERT INTO public.users (id, role_id, email)
SELECT
  b.owner_id,
  (SELECT id FROM public.roles WHERE name = 'business_owner'),
  au.email
FROM public.businesses b
JOIN auth.users au ON au.id = b.owner_id
WHERE b.owner_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Active staff (non-owners only)
INSERT INTO public.users (id, role_id, email)
SELECT
  s.user_id,
  (SELECT id FROM public.roles WHERE name = 'staff'),
  s.email
FROM public.staff s
WHERE s.user_id IS NOT NULL
  AND s.is_active = true
ON CONFLICT (id) DO NOTHING;

-- Customers
INSERT INTO public.users (id, role_id, email)
SELECT
  c.user_id,
  (SELECT id FROM public.roles WHERE name = 'customer'),
  au.email
FROM public.customers c
JOIN auth.users au ON au.id = c.user_id
WHERE c.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Remaining auth.users as customer
INSERT INTO public.users (id, role_id, email)
SELECT
  au.id,
  (SELECT id FROM public.roles WHERE name = 'customer'),
  au.email
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- 1h. updated_at trigger on public.users
CREATE OR REPLACE FUNCTION public.handle_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_users_updated_at();
