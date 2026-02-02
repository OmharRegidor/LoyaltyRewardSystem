-- Migration: Add slug column to businesses table
-- Used for business subdomains like: binukbok.noxaloyalty.com

-- Add slug column to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

-- Function to generate slug from business name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'business';
  END IF;

  -- Check for uniqueness, add number if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION set_business_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_business_slug ON businesses;
CREATE TRIGGER trigger_set_business_slug
  BEFORE INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION set_business_slug();

-- Generate slugs for existing businesses that don't have one
UPDATE businesses
SET slug = generate_slug(name)
WHERE slug IS NULL;
