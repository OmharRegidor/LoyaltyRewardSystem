-- ============================================
-- Manual Invoices table (admin-created invoices for enterprise billing)
-- ============================================

CREATE TABLE IF NOT EXISTS public.manual_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  description text,
  amount_centavos integer NOT NULL,
  amount_paid_centavos integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PHP',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partially_paid', 'paid', 'void')),
  period_start timestamptz,
  period_end timestamptz,
  due_date timestamptz,
  created_by_email text NOT NULL,
  notes text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sequence for auto-generating invoice numbers
CREATE SEQUENCE IF NOT EXISTS manual_invoice_seq START 1;

-- Indexes
CREATE INDEX idx_manual_invoices_business_id ON public.manual_invoices(business_id);
CREATE INDEX idx_manual_invoices_status ON public.manual_invoices(status);

-- ============================================
-- Manual Invoice Payments table
-- ============================================

CREATE TABLE IF NOT EXISTS public.manual_invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.manual_invoices(id) ON DELETE CASCADE,
  amount_centavos integer NOT NULL,
  payment_method text,
  reference_number text,
  notes text,
  recorded_by_email text NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_manual_invoice_payments_invoice_id ON public.manual_invoice_payments(invoice_id);

-- ============================================
-- Trigger: update invoice totals after payment insert
-- ============================================

CREATE OR REPLACE FUNCTION update_manual_invoice_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid integer;
  v_amount integer;
BEGIN
  SELECT COALESCE(SUM(amount_centavos), 0) INTO v_total_paid
  FROM public.manual_invoice_payments
  WHERE invoice_id = NEW.invoice_id;

  SELECT amount_centavos INTO v_amount
  FROM public.manual_invoices
  WHERE id = NEW.invoice_id;

  UPDATE public.manual_invoices
  SET
    amount_paid_centavos = v_total_paid,
    status = CASE
      WHEN v_total_paid >= v_amount THEN 'paid'
      WHEN v_total_paid > 0 THEN 'partially_paid'
      ELSE 'open'
    END,
    paid_at = CASE
      WHEN v_total_paid >= v_amount THEN now()
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_manual_invoice_after_payment
  AFTER INSERT ON public.manual_invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_invoice_after_payment();

-- ============================================
-- RLS policies
-- ============================================

ALTER TABLE public.manual_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view own invoices"
  ON public.manual_invoices FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can view own invoice payments"
  ON public.manual_invoice_payments FOR SELECT
  USING (
    invoice_id IN (
      SELECT mi.id FROM public.manual_invoices mi
      JOIN public.businesses b ON b.id = mi.business_id
      WHERE b.owner_id = auth.uid()
    )
  );
