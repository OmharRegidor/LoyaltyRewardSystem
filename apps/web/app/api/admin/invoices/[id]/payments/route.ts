import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RecordPaymentBody {
  amountCentavos: number;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  paymentDate?: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as RecordPaymentBody;
  const { amountCentavos, paymentMethod, referenceNumber, notes, paymentDate } = body;

  if (!amountCentavos || typeof amountCentavos !== 'number' || amountCentavos <= 0) {
    return NextResponse.json({ error: 'amountCentavos must be a positive number' }, { status: 400 });
  }

  const service = createAdminServiceClient();

  // Verify invoice exists and is not void/paid
  const { data: invoice } = await service
    .from('manual_invoices')
    .select('id, amount_centavos, amount_paid_centavos, status')
    .eq('id', id)
    .maybeSingle();

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.status === 'void') {
    return NextResponse.json({ error: 'Cannot add payment to a voided invoice' }, { status: 400 });
  }

  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Invoice is already fully paid' }, { status: 400 });
  }

  const remaining = invoice.amount_centavos - invoice.amount_paid_centavos;
  if (amountCentavos > remaining) {
    return NextResponse.json(
      { error: `Payment exceeds remaining balance of ${remaining} centavos` },
      { status: 400 },
    );
  }

  const { data: payment, error } = await service
    .from('manual_invoice_payments')
    .insert({
      invoice_id: id,
      amount_centavos: amountCentavos,
      payment_method: paymentMethod?.trim() || null,
      reference_number: referenceNumber?.trim() || null,
      notes: notes?.trim() || null,
      recorded_by_email: user.email,
      payment_date: paymentDate || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }

  // Fetch updated invoice (trigger has already updated totals)
  const { data: updatedInvoice } = await service
    .from('manual_invoices')
    .select('*')
    .eq('id', id)
    .single();

  return NextResponse.json({ payment, invoice: updatedInvoice }, { status: 201 });
}
