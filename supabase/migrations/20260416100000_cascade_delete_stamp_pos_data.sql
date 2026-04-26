-- Ensure stamp data is cleaned up when a customer is deleted.
-- stamp_cards.customer_id → CASCADE (deletes stamp_cards + their stamp_entries)
-- pos_sales.customer_id → SET NULL (preserve sales for accounting, de-link customer)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stamp_cards_customer_id_fkey'
    AND table_name = 'stamp_cards'
  ) THEN
    ALTER TABLE stamp_cards DROP CONSTRAINT stamp_cards_customer_id_fkey;
    ALTER TABLE stamp_cards ADD CONSTRAINT stamp_cards_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pos_sales_customer_id_fkey'
    AND table_name = 'pos_sales'
  ) THEN
    ALTER TABLE pos_sales DROP CONSTRAINT pos_sales_customer_id_fkey;
    ALTER TABLE pos_sales ADD CONSTRAINT pos_sales_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END;
$$;
