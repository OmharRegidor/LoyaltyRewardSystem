-- Create rate_limits table if not exists
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  identifier_type text NOT NULL,
  action text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  UNIQUE(identifier, identifier_type, action)
);

-- Create the check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_identifier_type text,
  p_action text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start timestamptz;
  v_request_count integer;
BEGIN
  -- Calculate window start time
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;

  -- Try to get existing rate limit record
  SELECT request_count, window_start
  INTO v_request_count, v_window_start
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND action = p_action;

  -- No existing record - create one and allow
  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (identifier, identifier_type, action, request_count, window_start)
    VALUES (p_identifier, p_identifier_type, p_action, 1, now());
    RETURN true;
  END IF;

  -- Check if window has expired - reset counter
  IF v_window_start < (now() - (p_window_seconds || ' seconds')::interval) THEN
    UPDATE public.rate_limits
    SET request_count = 1, window_start = now()
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND action = p_action;
    RETURN true;
  END IF;

  -- Check if within limit
  IF v_request_count < p_max_requests THEN
    UPDATE public.rate_limits
    SET request_count = request_count + 1
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND action = p_action;
    RETURN true;
  END IF;

  -- Rate limit exceeded
  RETURN false;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;
