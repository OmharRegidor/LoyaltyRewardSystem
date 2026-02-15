import { NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabaseClient,
  createAdminServiceClient,
} from '@/lib/supabase-server';
import { isAdminEmail } from '@/lib/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PlanChangeBody {
  newPlanId: string;
  reason?: string;
  moduleBooking?: boolean;
  modulePos?: boolean;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as PlanChangeBody;
  const { newPlanId, reason, moduleBooking, modulePos } = body;

  if (!newPlanId || typeof newPlanId !== 'string') {
    return NextResponse.json(
      { error: 'newPlanId is required' },
      { status: 400 },
    );
  }

  const service = createAdminServiceClient();

  // Validate plan exists
  const { data: plan } = await service
    .from('plans')
    .select('id, name, display_name')
    .eq('id', newPlanId)
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
  }

  // Get current subscription
  const { data: currentSub } = await service
    .from('subscriptions')
    .select('id, plan_id')
    .eq('business_id', id)
    .maybeSingle();

  const oldPlanId = currentSub?.plan_id ?? null;

  // Determine module overrides based on target plan
  const isEnterprise = plan.name === 'enterprise';
  const moduleOverrides = isEnterprise
    ? {
        module_booking_override: moduleBooking ?? true,
        module_pos_override: modulePos ?? true,
      }
    : {
        module_booking_override: null as boolean | null,
        module_pos_override: null as boolean | null,
      };

  if (currentSub) {
    // Update existing subscription
    const { error: updateErr } = await service
      .from('subscriptions')
      .update({
        plan_id: newPlanId,
        ...moduleOverrides,
      })
      .eq('id', currentSub.id);

    if (updateErr) {
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 },
      );
    }
  } else {
    // Create new subscription
    const { error: insertErr } = await service.from('subscriptions').insert({
      business_id: id,
      plan_id: newPlanId,
      status: 'active',
      billing_interval: 'monthly',
      ...moduleOverrides,
    });

    if (insertErr) {
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 },
      );
    }
  }

  // Insert audit record
  const { data: changeRecord, error: auditErr } = await service
    .from('admin_plan_changes')
    .insert({
      business_id: id,
      changed_by_email: user.email,
      old_plan_id: oldPlanId,
      new_plan_id: newPlanId,
      reason: reason?.trim() || null,
    })
    .select()
    .single();

  if (auditErr) {
    return NextResponse.json(
      { error: 'Plan updated but failed to log change' },
      { status: 500 },
    );
  }

  return NextResponse.json(changeRecord);
}
