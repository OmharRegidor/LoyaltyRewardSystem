-- Active session state: stores pending/active impersonations
CREATE TABLE public.impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email text NOT NULL,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_email text NOT NULL,
  target_role text NOT NULL CHECK (target_role IN ('business_owner', 'staff')),
  opaque_token_hash text NOT NULL UNIQUE,
  magic_otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  activated_at timestamptz,
  ended_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_impersonation_sessions_admin ON public.impersonation_sessions(admin_user_id, created_at DESC);
CREATE INDEX idx_impersonation_sessions_target ON public.impersonation_sessions(target_user_id);
CREATE INDEX idx_impersonation_sessions_active ON public.impersonation_sessions(id)
  WHERE activated_at IS NOT NULL AND ended_at IS NULL;

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_impersonation_sessions"
  ON public.impersonation_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Append-only audit log
CREATE TABLE public.impersonation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.impersonation_sessions(id) ON DELETE SET NULL,
  admin_user_id uuid,
  admin_email text NOT NULL,
  target_user_id uuid,
  target_email text NOT NULL,
  target_role text NOT NULL,
  event text NOT NULL CHECK (event IN ('initiated', 'activated', 'ended', 'expired', 'blocked_write')),
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_impersonation_logs_admin ON public.impersonation_logs(admin_user_id, created_at DESC);
CREATE INDEX idx_impersonation_logs_target ON public.impersonation_logs(target_user_id);
CREATE INDEX idx_impersonation_logs_created ON public.impersonation_logs(created_at DESC);

ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_read_impersonation_logs"
  ON public.impersonation_logs FOR SELECT TO service_role USING (true);
CREATE POLICY "service_insert_impersonation_logs"
  ON public.impersonation_logs FOR INSERT TO service_role WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.impersonation_logs_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'impersonation_logs is append-only';
END;
$$;

CREATE TRIGGER impersonation_logs_no_update
  BEFORE UPDATE ON public.impersonation_logs
  FOR EACH ROW EXECUTE FUNCTION public.impersonation_logs_immutable();

CREATE TRIGGER impersonation_logs_no_delete
  BEFORE DELETE ON public.impersonation_logs
  FOR EACH ROW EXECUTE FUNCTION public.impersonation_logs_immutable();
