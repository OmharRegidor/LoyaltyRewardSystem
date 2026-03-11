import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminServiceClient } from '@/lib/supabase-server';
import type { ManualInvoice, ManualInvoicePayment } from '@/lib/admin';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use admin client which knows about manual_invoices tables
  const service = createAdminServiceClient();

  // Find the business owned by this user
  const { data: business } = await service
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ invoices: [] });
  }

  // Fetch invoices (exclude voided)
  const { data: invoices, error } = await service
    .from('manual_invoices')
    .select('*')
    .eq('business_id', business.id)
    .neq('status', 'void')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ invoices: [] });
  }

  // Fetch payments for all invoices
  const invoiceIds = invoices.map((inv: ManualInvoice) => inv.id);
  const { data: payments } = await service
    .from('manual_invoice_payments')
    .select('*')
    .in('invoice_id', invoiceIds)
    .order('payment_date', { ascending: false });

  const paymentsByInvoice = new Map<string, ManualInvoicePayment[]>();
  for (const payment of (payments ?? []) as ManualInvoicePayment[]) {
    const existing = paymentsByInvoice.get(payment.invoice_id) ?? [];
    existing.push(payment);
    paymentsByInvoice.set(payment.invoice_id, existing);
  }

  const enriched = invoices.map((inv: ManualInvoice) => ({
    ...inv,
    payments: paymentsByInvoice.get(inv.id) ?? [],
  }));

  return NextResponse.json({ invoices: enriched });
}
