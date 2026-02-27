-- Trigger function: when a customer is inserted with an email but no user_id,
-- check auth.users for a matching email and auto-set user_id.
CREATE OR REPLACE FUNCTION public.auto_link_customer_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only act if user_id is not already set and email is provided
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      NEW.user_id := v_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on customers table
DROP TRIGGER IF EXISTS trg_auto_link_customer_on_insert ON public.customers;
CREATE TRIGGER trg_auto_link_customer_on_insert
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_customer_on_insert();
