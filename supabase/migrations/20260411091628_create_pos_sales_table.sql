-- Create the pos_sales table.
--
-- This table was originally introduced on dev via an out-of-band SQL session
-- (Studio editor / MCP apply_migration), so it has no source-controlled
-- migration. Subsequent migrations
--   - 20260418045257_fix_process_staff_sale_use_pos_sales
--   - 20260426010000_transactions_stamps_and_backfill
-- assume pos_sales already exists (the first rewrites the staff sale RPC to
-- insert into it; the second adds an FK from transactions.sale_id to it).
-- This migration brings prod up to dev's structure.
--
-- It also migrates the existing `sales` rows into `pos_sales`, preserving IDs,
-- and switches the `sale_items.sale_id` FK to point at pos_sales — so
-- historical sales stay queryable through the new table and existing
-- sale_items rows remain valid.
--
-- The legacy `sales` table is left in place (read-only at this point) so it
-- can be inspected if any historical data inconsistency surfaces. It can be
-- dropped in a follow-up migration once pos_sales has been verified in prod.

-- 1. Create pos_sales
CREATE TABLE IF NOT EXISTS public.pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  staff_id UUID,
  staff_name TEXT,
  sale_number VARCHAR NOT NULL,
  subtotal_centavos INTEGER NOT NULL DEFAULT 0,
  discount_centavos INTEGER NOT NULL DEFAULT 0,
  discount_type VARCHAR,
  discount_reason VARCHAR,
  exchange_points INTEGER NOT NULL DEFAULT 0,
  exchange_discount_centavos INTEGER NOT NULL DEFAULT 0,
  total_centavos INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  points_redeemed INTEGER NOT NULL DEFAULT 0,
  tier_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  tier_name TEXT DEFAULT 'Bronze',
  amount_tendered_centavos INTEGER,
  change_centavos INTEGER NOT NULL DEFAULT 0,
  payment_method VARCHAR DEFAULT 'cash',
  idempotency_key TEXT,
  status VARCHAR DEFAULT 'completed',
  voided_at TIMESTAMPTZ,
  voided_by UUID,
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_pos_sales_business_id ON public.pos_sales(business_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_customer_id ON public.pos_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_created_at ON public.pos_sales(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_sales_idempotency
  ON public.pos_sales(business_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 3. Migrate historical rows from sales → pos_sales (preserve IDs, skip if
--    already present so this is safe to re-run).
INSERT INTO public.pos_sales (
  id, business_id, customer_id, staff_id, staff_name, sale_number,
  subtotal_centavos, discount_centavos, discount_type, discount_reason,
  total_centavos, points_earned, points_redeemed,
  amount_tendered_centavos, change_centavos, payment_method,
  status, voided_at, voided_by, void_reason,
  created_at, updated_at
)
SELECT
  s.id,
  s.business_id,
  s.customer_id,
  s.staff_id,
  st.name,
  s.sale_number,
  s.subtotal_centavos,
  s.discount_centavos,
  s.discount_type,
  s.discount_reason,
  s.total_centavos,
  COALESCE(s.points_earned, 0),
  COALESCE(s.points_redeemed, 0),
  s.amount_tendered_centavos,
  COALESCE(s.change_centavos, 0),
  s.payment_method,
  COALESCE(s.status, 'completed'),
  s.voided_at,
  s.voided_by,
  s.void_reason,
  COALESCE(s.created_at, now()),
  COALESCE(s.updated_at, now())
FROM public.sales s
LEFT JOIN public.staff st ON st.id = s.staff_id
ON CONFLICT (id) DO NOTHING;

-- 4. Switch sale_items.sale_id FK from sales(id) → pos_sales(id).
--    Wrapped in a DO block so the migration is safe to re-run if the FK is
--    already pointing at pos_sales.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.referential_constraints rc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = rc.constraint_name
    WHERE rc.constraint_name = 'sale_items_sale_id_fkey'
      AND ccu.table_name = 'sales'
  ) THEN
    ALTER TABLE public.sale_items DROP CONSTRAINT sale_items_sale_id_fkey;
    ALTER TABLE public.sale_items
      ADD CONSTRAINT sale_items_sale_id_fkey
      FOREIGN KEY (sale_id) REFERENCES public.pos_sales(id) ON DELETE CASCADE;
  END IF;
END;
$$;
