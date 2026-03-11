import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import type { ManualInvoiceWithBusiness } from '@/lib/admin';

interface CreateInvoiceBody {
  businessId: string;
  description?: string;
  amountCentavos: number;
  dueDate?: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
}

export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const businessId = searchParams.get('businessId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const service = createAdminServiceClient();

  let query = service
    .from('manual_invoices')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const validStatuses = ['open', 'partially_paid', 'paid', 'void'] as const;
  if (status && status !== 'all' && validStatuses.includes(status as typeof validStatuses[number])) {
    query = query.eq('status', status as typeof validStatuses[number]);
  }
  if (businessId) {
    query = query.eq('business_id', businessId);
  }

  const { data: invoices, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ invoices: [], totalCount: 0, page });
  }

  // Fetch business names
  const businessIds = [...new Set(invoices.map((inv) => inv.business_id))];
  const { data: businesses } = await service
    .from('businesses')
    .select('id, name, owner_email')
    .in('id', businessIds);

  const bizMap = new Map<string, { name: string; owner_email: string | null }>();
  for (const b of businesses ?? []) {
    bizMap.set(b.id, { name: b.name, owner_email: b.owner_email });
  }

  const enriched: ManualInvoiceWithBusiness[] = invoices.map((inv) => {
    const biz = bizMap.get(inv.business_id);
    return {
      ...inv,
      business_name: biz?.name ?? 'Unknown',
      owner_email: biz?.owner_email ?? null,
    };
  });

  return NextResponse.json({ invoices: enriched, totalCount: count ?? 0, page });
}

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as CreateInvoiceBody;
  const { businessId, description, amountCentavos, dueDate, periodStart, periodEnd, notes } = body;

  if (!businessId || typeof businessId !== 'string') {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }
  if (!amountCentavos || typeof amountCentavos !== 'number' || amountCentavos <= 0) {
    return NextResponse.json({ error: 'amountCentavos must be a positive number' }, { status: 400 });
  }

  const service = createAdminServiceClient();

  // Verify business exists
  const { data: business } = await service
    .from('businesses')
    .select('id, name')
    .eq('id', businessId)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  // Generate invoice number: INV-YYYYMMDD-XXXX
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const { data: seqResult } = await service.rpc('nextval' as never, {
    seq_name: 'manual_invoice_seq',
  } as never) as { data: number | null };
  const seqNum = seqResult ?? 1;
  const invoiceNumber = `INV-${dateStr}-${String(seqNum).padStart(4, '0')}`;

  const { data: invoice, error } = await service
    .from('manual_invoices')
    .insert({
      business_id: businessId,
      invoice_number: invoiceNumber,
      description: description?.trim() || null,
      amount_centavos: amountCentavos,
      due_date: dueDate || null,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      notes: notes?.trim() || null,
      created_by_email: user.email,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }

  return NextResponse.json(invoice, { status: 201 });
}
