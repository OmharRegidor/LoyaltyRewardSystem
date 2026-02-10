-- Migration: POS Lite Feature
-- This migration adds support for simple Point of Sale functionality

-- ============================================
-- CREATE PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_centavos INTEGER NOT NULL CHECK (price_centavos >= 0),
  category VARCHAR(100),
  sku VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_active ON products(business_id, is_active);
CREATE INDEX idx_products_sku ON products(business_id, sku) WHERE sku IS NOT NULL;

-- ============================================
-- CREATE SALES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,

  sale_number VARCHAR(20) NOT NULL,

  -- ALL PRICES IN CENTAVOS (INTEGER)
  subtotal_centavos INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_centavos >= 0),
  discount_centavos INTEGER NOT NULL DEFAULT 0 CHECK (discount_centavos >= 0),
  discount_type VARCHAR(20), -- 'percentage' | 'fixed'
  discount_reason VARCHAR(255),
  total_centavos INTEGER NOT NULL CHECK (total_centavos >= 0),

  payment_method VARCHAR(20) NOT NULL, -- 'cash' | 'gcash' | 'maya' | 'card'
  payment_reference VARCHAR(100),
  amount_tendered_centavos INTEGER,
  change_centavos INTEGER,

  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,

  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'completed' | 'voided'
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES staff(id),
  void_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_sales_business_id ON sales(business_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_created_at ON sales(business_id, created_at DESC);
CREATE INDEX idx_sales_sale_number ON sales(business_id, sale_number);
CREATE INDEX idx_sales_status ON sales(business_id, status);

-- ============================================
-- CREATE SALE_ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_centavos INTEGER NOT NULL CHECK (unit_price_centavos >= 0),
  total_centavos INTEGER NOT NULL CHECK (total_centavos >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- ============================================
-- SALE NUMBER GENERATOR
-- ============================================

CREATE OR REPLACE FUNCTION generate_sale_number(p_business_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_count INTEGER;
  v_date TEXT;
  v_number VARCHAR(20);
BEGIN
  -- Get today's date in YYYYMMDD format
  v_date := to_char(CURRENT_DATE, 'YYYYMMDD');

  -- Count today's sales for this business
  SELECT COUNT(*) + 1 INTO v_count
  FROM sales
  WHERE business_id = p_business_id
    AND DATE(created_at) = CURRENT_DATE;

  -- Format: YYYYMMDD-NNNN (e.g., 20260206-0001)
  v_number := v_date || '-' || LPAD(v_count::TEXT, 4, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Allow service role full access
CREATE POLICY "Service role full access to products"
  ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated business owners to manage their products
CREATE POLICY "Business owners can manage their products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = products.business_id
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = products.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Allow staff to view products for their business
CREATE POLICY "Staff can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = products.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );

-- ============================================
-- SALES POLICIES
-- ============================================

-- Allow service role full access
CREATE POLICY "Service role full access to sales"
  ON sales
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated business owners to manage their sales
CREATE POLICY "Business owners can manage their sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = sales.business_id
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = sales.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Allow staff to manage sales for their business
CREATE POLICY "Staff can manage sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = sales.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = sales.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );

-- ============================================
-- SALE_ITEMS POLICIES
-- ============================================

-- Allow service role full access
CREATE POLICY "Service role full access to sale_items"
  ON sale_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow authenticated business owners to view sale items
CREATE POLICY "Business owners can view sale items"
  ON sale_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales
      JOIN businesses ON businesses.id = sales.business_id
      WHERE sales.id = sale_items.sale_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Allow staff to manage sale items
CREATE POLICY "Staff can manage sale items"
  ON sale_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales
      JOIN staff ON staff.business_id = sales.business_id
      WHERE sales.id = sale_items.sale_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales
      JOIN staff ON staff.business_id = sales.business_id
      WHERE sales.id = sale_items.sale_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );

-- ============================================
-- UPDATE TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

CREATE OR REPLACE FUNCTION update_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_updated_at();
