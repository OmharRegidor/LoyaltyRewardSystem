-- ============================================
-- Per-Business Points Balance
-- Prevents cross-business points farming
-- ============================================

-- 1. Add per-business points column
ALTER TABLE customer_businesses ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill from existing transactions
UPDATE customer_businesses cb SET points = COALESCE((
  SELECT SUM(CASE WHEN t.type = 'earn' THEN t.points ELSE -t.points END)
  FROM transactions t
  WHERE t.customer_id = cb.customer_id AND t.business_id = cb.business_id
), 0);

-- 3. RPC: add points to specific business
CREATE OR REPLACE FUNCTION add_business_points(p_customer_id UUID, p_business_id UUID, p_points INT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE customer_businesses SET points = points + p_points
  WHERE customer_id = p_customer_id AND business_id = p_business_id;
END;
$$;

-- 4. RPC: deduct points from specific business (with validation)
CREATE OR REPLACE FUNCTION deduct_business_points(p_customer_id UUID, p_business_id UUID, p_points INT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE customer_businesses SET points = points - p_points
  WHERE customer_id = p_customer_id AND business_id = p_business_id AND points >= p_points;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient points at this business';
  END IF;
END;
$$;

-- 5. Update auto-link trigger to also handle points on earn/redeem transactions
CREATE OR REPLACE FUNCTION public.trg_auto_link_customer_business()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO customer_businesses (customer_id, business_id, points)
  VALUES (NEW.customer_id, NEW.business_id, CASE WHEN NEW.type = 'earn' THEN NEW.points ELSE 0 END)
  ON CONFLICT (customer_id, business_id) DO UPDATE
  SET points = customer_businesses.points + CASE WHEN NEW.type = 'earn' THEN NEW.points WHEN NEW.type = 'redeem' THEN -NEW.points ELSE 0 END;
  RETURN NEW;
END;
$$;

-- ============================================
-- Fix QR Scan for OAuth Customers (RLS)
-- ============================================

-- Allow authenticated users (staff/owners) to read any customer by qr_code_url or id
DROP POLICY IF EXISTS "Staff can read customers" ON customers;
CREATE POLICY "Staff can read customers" ON customers
FOR SELECT TO authenticated
USING (true);

-- Allow authenticated users to update customers (for setting created_by_business_id, points, etc.)
DROP POLICY IF EXISTS "Staff can update customers" ON customers;
CREATE POLICY "Staff can update customers" ON customers
FOR UPDATE TO authenticated
USING (true);

-- Allow authenticated users to insert customers (for staff-created customers)
DROP POLICY IF EXISTS "Staff can insert customers" ON customers;
CREATE POLICY "Staff can insert customers" ON customers
FOR INSERT TO authenticated
WITH CHECK (true);
