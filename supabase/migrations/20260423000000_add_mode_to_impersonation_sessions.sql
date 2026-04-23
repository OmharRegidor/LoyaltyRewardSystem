-- Add mode + reason columns for impersonation edit mode.
-- Existing rows default to 'read_only' so prior behavior is unchanged.
ALTER TABLE public.impersonation_sessions
  ADD COLUMN mode text NOT NULL DEFAULT 'read_only'
    CHECK (mode IN ('read_only', 'edit')),
  ADD COLUMN reason text;

-- reason is required by the API layer when mode='edit'; we do NOT enforce it
-- at the DB layer so read-only sessions can keep reason NULL without tripping
-- a CHECK.

CREATE INDEX idx_impersonation_sessions_mode
  ON public.impersonation_sessions(mode)
  WHERE mode = 'edit';
