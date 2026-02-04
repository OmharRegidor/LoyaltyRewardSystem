-- Migration: Add slug column to businesses table for subdomain-based URLs
-- Example: binukbok-resort.noxaloyalty.com

-- 1. Add slug column (nullable initially for backfill)
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- 2. Create slug generation function
CREATE OR REPLACE FUNCTION generate_business_slug(business_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Lowercase, replace spaces with hyphens, remove special chars
  base_slug := LOWER(TRIM(business_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  base_slug := LEFT(base_slug, 100);

  final_slug := base_slug;

  -- If slug exists, append incrementing number
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := LEFT(base_slug, 96) || '-' || counter::TEXT;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger function for auto-generation on insert
CREATE OR REPLACE FUNCTION set_business_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_business_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_set_business_slug ON businesses;

CREATE TRIGGER trigger_set_business_slug
BEFORE INSERT ON businesses
FOR EACH ROW
EXECUTE FUNCTION set_business_slug();

-- 4. Backfill existing businesses with generated slugs
UPDATE businesses
SET slug = generate_business_slug(name)
WHERE slug IS NULL;

-- 5. Add NOT NULL constraint after backfill
ALTER TABLE businesses
ALTER COLUMN slug SET NOT NULL;

-- 6. Add index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
