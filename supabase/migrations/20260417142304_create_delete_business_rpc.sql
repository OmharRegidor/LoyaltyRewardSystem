-- Atomic business deletion: runs in a single transaction (Postgres functions are transactional)
-- Returns the owner_id so the API route can delete the auth user afterward.
-- Preserves audit_logs by nulling business_id rather than deleting them.

CREATE OR REPLACE FUNCTION public.delete_business(
  p_business_id uuid,
  p_admin_email text DEFAULT NULL
)
RETURNS TABLE (owner_id uuid, business_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
  v_business_name text;
  v_customer_ids uuid[];
  v_staff_ids uuid[];
  v_sale_ids uuid[];
  v_invoice_ids uuid[];
  v_stamp_card_ids uuid[];
BEGIN
  SELECT b.owner_id, b.name
    INTO v_owner_id, v_business_name
  FROM public.businesses b
  WHERE b.id = p_business_id;

  IF v_business_name IS NULL THEN
    RAISE EXCEPTION 'Business not found: %', p_business_id
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT array_agg(s.id) INTO v_sale_ids FROM public.sales s WHERE s.business_id = p_business_id;
  SELECT array_agg(i.id) INTO v_invoice_ids FROM public.manual_invoices i WHERE i.business_id = p_business_id;
  SELECT array_agg(cb.customer_id) INTO v_customer_ids FROM public.customer_businesses cb WHERE cb.business_id = p_business_id;
  SELECT array_agg(st.id) INTO v_staff_ids FROM public.staff st WHERE st.business_id = p_business_id;
  SELECT array_agg(sc.id) INTO v_stamp_card_ids FROM public.stamp_cards sc WHERE sc.business_id = p_business_id;

  IF v_sale_ids IS NOT NULL THEN
    DELETE FROM public.sale_items WHERE sale_id = ANY(v_sale_ids);
  END IF;
  IF v_invoice_ids IS NOT NULL THEN
    DELETE FROM public.manual_invoice_payments WHERE invoice_id = ANY(v_invoice_ids);
  END IF;
  IF v_staff_ids IS NOT NULL THEN
    DELETE FROM public.staff_services WHERE staff_id = ANY(v_staff_ids);
  END IF;
  IF v_stamp_card_ids IS NOT NULL THEN
    DELETE FROM public.stamp_entries WHERE stamp_card_id = ANY(v_stamp_card_ids);
  END IF;

  DELETE FROM public.stock_movements WHERE business_id = p_business_id;
  DELETE FROM public.sales WHERE business_id = p_business_id;
  DELETE FROM public.pos_sales WHERE business_id = p_business_id;
  DELETE FROM public.referral_completions WHERE business_id = p_business_id;
  DELETE FROM public.scan_logs WHERE business_id = p_business_id;
  DELETE FROM public.verification_codes WHERE business_id = p_business_id;
  DELETE FROM public.redemptions WHERE business_id = p_business_id;
  DELETE FROM public.transactions WHERE business_id = p_business_id;
  DELETE FROM public.notifications WHERE business_id = p_business_id;
  DELETE FROM public.stamp_cards WHERE business_id = p_business_id;
  DELETE FROM public.stamp_card_templates WHERE business_id = p_business_id;

  IF v_customer_ids IS NOT NULL THEN
    DELETE FROM public.push_tokens WHERE customer_id = ANY(v_customer_ids);
  END IF;

  DELETE FROM public.rewards WHERE business_id = p_business_id;
  DELETE FROM public.referral_codes WHERE business_id = p_business_id;
  DELETE FROM public.customer_businesses WHERE business_id = p_business_id;

  UPDATE public.customers SET created_by_business_id = NULL WHERE created_by_business_id = p_business_id;
  IF v_customer_ids IS NOT NULL THEN
    DELETE FROM public.customers c
    WHERE c.id = ANY(v_customer_ids)
      AND NOT EXISTS (
        SELECT 1 FROM public.customer_businesses cb
        WHERE cb.customer_id = c.id
      );
  END IF;

  DELETE FROM public.staff_invites WHERE business_id = p_business_id;
  DELETE FROM public.staff WHERE business_id = p_business_id;

  DELETE FROM public.branches WHERE business_id = p_business_id;
  DELETE FROM public.products WHERE business_id = p_business_id;
  DELETE FROM public.manual_invoices WHERE business_id = p_business_id;
  DELETE FROM public.invoices WHERE business_id = p_business_id;
  DELETE FROM public.payment_history WHERE business_id = p_business_id;
  DELETE FROM public.payments WHERE business_id = p_business_id;
  DELETE FROM public.subscriptions WHERE business_id = p_business_id;
  DELETE FROM public.upgrade_requests WHERE business_id = p_business_id;
  DELETE FROM public.usage_tracking WHERE business_id = p_business_id;
  DELETE FROM public.admin_notes WHERE business_id = p_business_id;
  DELETE FROM public.admin_tags WHERE business_id = p_business_id;
  DELETE FROM public.admin_plan_changes WHERE business_id = p_business_id;

  UPDATE public.audit_logs SET business_id = NULL WHERE business_id = p_business_id;

  DELETE FROM public.businesses WHERE id = p_business_id;

  INSERT INTO public.audit_logs (event_type, severity, user_id, details, created_at)
  VALUES (
    'business.deleted',
    'warn',
    NULL,
    jsonb_build_object(
      'business_id', p_business_id,
      'business_name', v_business_name,
      'deleted_by', p_admin_email,
      'owner_id', v_owner_id
    ),
    now()
  );

  RETURN QUERY SELECT v_owner_id, v_business_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_business(uuid, text) TO service_role;
