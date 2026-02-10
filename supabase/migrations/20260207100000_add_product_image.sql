-- Add image_url column to products table for POS product images
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.image_url IS 'URL to product image stored in Supabase Storage';
