import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  status?: 'void';
  notes?: string;
  dueDate?: string;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const service = createAdminServiceClient();

  const { data: invoice, error } = await service
    .from('manual_invoices')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Fetch business info
  const { data: business } = await service
    .from('businesses')
    .select('name, owner_email')
    .eq('id', invoice.business_id)
    .maybeSingle();

  // Fetch payments
  const { data: payments } = await service
    .from('manual_invoice_payments')
    .select('*')
    .eq('invoice_id', id)
    .order('payment_date', { ascending: false });

  return NextResponse.json({
    ...invoice,
    business_name: business?.name ?? 'Unknown',
    owner_email: business?.owner_email ?? null,
    payments: payments ?? [],
  });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as PatchBody;
  const service = createAdminServiceClient();

  // Verify invoice exists
  const { data: existing } = await service
    .from('manual_invoices')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status === 'void') {
    if (existing.status === 'paid') {
      return NextResponse.json({ error: 'Cannot void a paid invoice' }, { status: 400 });
    }
    updates.status = 'void';
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes?.trim() || null;
  }

  if (body.dueDate !== undefined) {
    updates.due_date = body.dueDate || null;
  }

  const { data: updated, error } = await service
    .from('manual_invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }

  return NextResponse.json(updated);
}
