-- Migration: POS Inventory Feature
-- Adds inventory tracking to existing POS products with immutable audit trail

-- ============================================
-- ADD STOCK COLUMNS TO PRODUCTS
-- ============================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;

-- ============================================
-- CREATE STOCK MOVEMENTS TABLE (immutable audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL, -- 'sale' | 'void_restore' | 'receiving' | 'adjustment'
  quantity INTEGER NOT NULL, -- signed: negative = stock out, positive = stock in
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  performed_by UUID, -- user ID
  performer_name VARCHAR(255), -- denormalized for audit readability
  reason TEXT, -- required for adjustments
  reference_id UUID, -- links to sales.id for sale/void movements
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_stock_movements_business_date ON stock_movements(business_id, created_at DESC);
CREATE INDEX idx_stock_movements_product_date ON stock_movements(product_id, created_at DESC);
CREATE INDEX idx_stock_movements_business_type ON stock_movements(business_id, movement_type);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_id) WHERE reference_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Service role: full access
CREATE POLICY "Service role full access to stock_movements"
  ON stock_movements
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Business owners: SELECT + INSERT on own data (no UPDATE/DELETE — immutable)
CREATE POLICY "Business owners can view stock movements"
  ON stock_movements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = stock_movements.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can insert stock movements"
  ON stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = stock_movements.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Staff: SELECT + INSERT on their business data (no UPDATE/DELETE — immutable)
CREATE POLICY "Staff can view stock movements"
  ON stock_movements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = stock_movements.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );

CREATE POLICY "Staff can insert stock movements"
  ON stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.business_id = stock_movements.business_id
      AND staff.user_id = auth.uid()
      AND staff.is_active = true
    )
  );
