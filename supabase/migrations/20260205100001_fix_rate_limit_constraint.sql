-- Fix rate_limits check constraint to include 'ip_address'
-- The existing constraint doesn't include 'ip_address' which is used for self-signup rate limiting

-- Drop the existing check constraint if it exists
ALTER TABLE public.rate_limits DROP CONSTRAINT IF EXISTS rate_limits_identifier_type_check;

-- Add updated constraint that includes 'ip_address'
ALTER TABLE public.rate_limits ADD CONSTRAINT rate_limits_identifier_type_check
  CHECK (identifier_type IN ('ip_address', 'user_id', 'phone', 'email'));
