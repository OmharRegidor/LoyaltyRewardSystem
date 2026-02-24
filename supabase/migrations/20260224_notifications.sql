-- ============================================
-- NOTIFICATIONS & PUSH TOKENS
-- ============================================

-- 1. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'new_reward',
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_customer_id ON public.notifications(customer_id);
CREATE INDEX idx_notifications_customer_unread ON public.notifications(customer_id) WHERE is_read = false;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own notifications"
  ON public.notifications FOR SELECT
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Customers can update own notifications"
  ON public.notifications FOR UPDATE
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  ));

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Push tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'android',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, token)
);

-- RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can insert own push tokens"
  ON public.push_tokens FOR INSERT
  WITH CHECK (customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Customers can view own push tokens"
  ON public.push_tokens FOR SELECT
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Customers can delete own push tokens"
  ON public.push_tokens FOR DELETE
  USING (customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  ));

-- 3. PG function: create notification rows for all followers when a new reward is added
CREATE OR REPLACE FUNCTION public.notify_followers_on_new_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_name text;
  v_reward_title text;
  v_reward_desc text;
BEGIN
  -- Only notify for active, visible rewards
  IF NEW.is_active IS NOT TRUE OR NEW.is_visible IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Get business name
  SELECT name INTO v_business_name
  FROM public.businesses
  WHERE id = NEW.business_id;

  -- Build notification content
  v_reward_title := COALESCE(NEW.title, 'a new reward');
  v_reward_desc := COALESCE(NEW.description, '');

  -- Insert a notification for each follower
  INSERT INTO public.notifications (customer_id, business_id, type, title, body, data)
  SELECT
    cb.customer_id,
    NEW.business_id,
    'new_reward',
    'New Reward from ' || COALESCE(v_business_name, 'a business'),
    v_reward_title || CASE WHEN v_reward_desc <> '' THEN ' — ' || v_reward_desc ELSE '' END,
    jsonb_build_object(
      'reward_id', NEW.id,
      'business_id', NEW.business_id,
      'points_cost', COALESCE(NEW.points_cost, 0)
    )
  FROM public.customer_businesses cb
  WHERE cb.business_id = NEW.business_id;

  RETURN NEW;
END;
$$;

-- 4. Trigger
CREATE TRIGGER trg_notify_followers_on_new_reward
  AFTER INSERT ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_followers_on_new_reward();
