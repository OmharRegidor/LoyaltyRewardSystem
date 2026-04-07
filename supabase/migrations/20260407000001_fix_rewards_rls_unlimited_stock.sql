-- Fix: rewards with stock = -1 (unlimited) were excluded from public view
-- The RLS policy only allowed stock IS NULL OR stock > 0, missing stock = -1

DROP POLICY IF EXISTS "Public can view active rewards" ON "public"."rewards";

CREATE POLICY "Public can view active rewards" ON "public"."rewards"
  FOR SELECT
  TO anon, authenticated
  USING (
    (is_active = true)
    AND (is_visible = true)
    AND ((stock IS NULL) OR (stock = -1) OR (stock > 0))
    AND (EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = rewards.business_id
        AND businesses.subscription_status = ANY (ARRAY['active'::public.subscription_status, 'trialing'::public.subscription_status])
    ))
  );
