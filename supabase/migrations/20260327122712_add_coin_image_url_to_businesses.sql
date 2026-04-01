ALTER TABLE businesses ADD COLUMN IF NOT EXISTS coin_name text NOT NULL DEFAULT 'Points';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS coin_image_url text;
CREATE INDEX IF NOT EXISTS idx_customers_qr_code_url ON public.customers USING btree (qr_code_url) WHERE qr_code_url IS NOT NULL;
