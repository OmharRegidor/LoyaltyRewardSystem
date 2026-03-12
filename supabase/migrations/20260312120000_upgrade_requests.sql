-- Self-service upgrade requests table
CREATE TABLE IF NOT EXISTS public.upgrade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  owner_email text NOT NULL,
  screenshot_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by_email text,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_upgrade_requests_business_id ON public.upgrade_requests(business_id);
CREATE INDEX idx_upgrade_requests_status ON public.upgrade_requests(status);

-- RLS
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own upgrade requests"
  ON public.upgrade_requests FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can create upgrade requests"
  ON public.upgrade_requests FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Add upgrade_acknowledged to subscriptions (default true so existing users don't see modal)
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS upgrade_acknowledged boolean DEFAULT true;

-- Storage bucket for upgrade screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('upgrade-screenshots', 'upgrade-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to upgrade-screenshots bucket
CREATE POLICY "Authenticated users can upload upgrade screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'upgrade-screenshots');

-- Allow public read access for upgrade screenshots
CREATE POLICY "Public read access for upgrade screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'upgrade-screenshots');
