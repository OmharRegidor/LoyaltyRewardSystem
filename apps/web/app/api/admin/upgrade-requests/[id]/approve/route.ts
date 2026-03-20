import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Validate UUID format
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
  }

  const service = createAdminServiceClient();

  // 1. Get the upgrade request
  const { data: upgradeReq, error: fetchError } = await service
    .from('upgrade_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !upgradeReq) {
    return NextResponse.json({ error: 'Upgrade request not found' }, { status: 404 });
  }

  if (upgradeReq.status !== 'pending') {
    return NextResponse.json(
      { error: 'Request is not pending' },
      { status: 400 }
    );
  }

  // 2. Find the enterprise plan
  const { data: enterprisePlan } = await service
    .from('plans')
    .select('id, name, display_name')
    .eq('name', 'enterprise')
    .single();

  if (!enterprisePlan) {
    return NextResponse.json(
      { error: 'Enterprise plan not found in database' },
      { status: 500 }
    );
  }

  // 3. Get current subscription (if any) for audit trail
  const { data: currentSub } = await service
    .from('subscriptions')
    .select('id, plan_id')
    .eq('business_id', upgradeReq.business_id)
    .maybeSingle();

  const oldPlanId = currentSub?.plan_id ?? null;

  // 4. Upsert subscription
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  if (currentSub) {
    const { error: updateErr } = await service
      .from('subscriptions')
      .update({
        plan_id: enterprisePlan.id,
        status: 'active',
        billing_interval: 'annual',
        module_pos_override: true,
        upgrade_acknowledged: false,
        current_period_start: now.toISOString(),
        current_period_end: oneYearLater.toISOString(),
      })
      .eq('id', currentSub.id);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }
  } else {
    const { error: insertErr } = await service
      .from('subscriptions')
      .insert({
        business_id: upgradeReq.business_id,
        plan_id: enterprisePlan.id,
        status: 'active',
        billing_interval: 'annual',
        module_pos_override: true,
        upgrade_acknowledged: false,
        current_period_start: now.toISOString(),
        current_period_end: oneYearLater.toISOString(),
      });

    if (insertErr) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
  }

  // 5. Create paid invoice + payment record
  // ₱14,900 annual (₱1,490/mo x 10 months — 2 months free) — stored in centavos
  const annualPesos = 14900;
  const amountCentavos = annualPesos * 100;

  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  // nextval is a raw Postgres function not in the generated Supabase types.
  // The `as never` casts are required to call untyped RPC functions through the typed client.
  const { data: seqResult } = await service.rpc('nextval' as never, {
    seq_name: 'manual_invoice_seq',
  } as never) as { data: number | null };
  const seqNum = seqResult ?? 1;
  const invoiceNumber = `INV-${dateStr}-${String(seqNum).padStart(4, '0')}`;

  const { data: invoice, error: invoiceErr } = await service
    .from('manual_invoices')
    .insert({
      business_id: upgradeReq.business_id,
      invoice_number: invoiceNumber,
      description: 'POS + Inventory — ₱1,490/mo billed annually at ₱14,900',
      amount_centavos: amountCentavos,
      amount_paid_centavos: amountCentavos,
      currency: 'PHP',
      status: 'paid',
      period_start: now.toISOString(),
      period_end: oneYearLater.toISOString(),
      created_by_email: user.email,
      paid_at: now.toISOString(),
    })
    .select()
    .single();

  if (invoiceErr || !invoice) {
    console.error('Invoice creation error:', invoiceErr);
    // Subscription was already created, log but don't fail
  }

  // Create payment record for the invoice
  if (invoice) {
    await service.from('manual_invoice_payments').insert({
      invoice_id: invoice.id,
      amount_centavos: amountCentavos,
      payment_method: 'self-service',
      notes: 'Self-service upgrade — ₱14,900 via screenshot verification',
      recorded_by_email: user.email,
      payment_date: now.toISOString(),
    });
  }

  // 6. Audit trail
  await service.from('admin_plan_changes').insert({
    business_id: upgradeReq.business_id,
    changed_by_email: user.email,
    old_plan_id: oldPlanId,
    new_plan_id: enterprisePlan.id,
    reason: 'Self-service upgrade approved',
  });

  // 7. Mark request as approved
  await service
    .from('upgrade_requests')
    .update({
      status: 'approved',
      reviewed_by_email: user.email,
      reviewed_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', id);

  return NextResponse.json({ success: true });
}
