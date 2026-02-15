import { NextResponse } from 'next/server';
import {
  createServerSupabaseClient,
  createAdminServiceClient,
} from '@/lib/supabase-server';
import { isAdminEmail } from '@/lib/admin';
import type { EnterpriseAccount } from '@/lib/admin';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createAdminServiceClient();

  // Find the enterprise plan
  const { data: enterprisePlan } = await service
    .from('plans')
    .select('id, display_name, has_booking, has_pos')
    .eq('name', 'enterprise')
    .maybeSingle();

  if (!enterprisePlan) {
    return NextResponse.json([]);
  }

  // Get all subscriptions on the enterprise plan (include module overrides)
  const { data: subs, error } = await service
    .from('subscriptions')
    .select('id, business_id, updated_at, module_booking_override, module_pos_override')
    .eq('plan_id', enterprisePlan.id)
    .eq('status', 'active');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch enterprise accounts' }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json([]);
  }

  const businessIds = subs.map((s) => s.business_id);

  // Fetch business names and upgrade dates in parallel
  const [businessResult, changesResult] = await Promise.all([
    service
      .from('businesses')
      .select('id, name, owner_email')
      .in('id', businessIds),
    service
      .from('admin_plan_changes')
      .select('business_id, created_at')
      .eq('new_plan_id', enterprisePlan.id)
      .in('business_id', businessIds)
      .order('created_at', { ascending: false }),
  ]);

  const businessMap = new Map<string, { name: string; ownerEmail: string | null }>();
  for (const b of businessResult.data ?? []) {
    businessMap.set(b.id, { name: b.name, ownerEmail: b.owner_email });
  }

  // Map business_id to most recent upgrade date
  const upgradeDateMap = new Map<string, string>();
  for (const c of changesResult.data ?? []) {
    if (!upgradeDateMap.has(c.business_id)) {
      upgradeDateMap.set(c.business_id, c.created_at);
    }
  }

  // Resolve effective modules: override ?? plan default
  const planHasBooking = enterprisePlan.has_booking === true;
  const planHasPos = enterprisePlan.has_pos === true;

  const accounts: EnterpriseAccount[] = subs.map((sub) => {
    const biz = businessMap.get(sub.business_id);
    return {
      id: sub.id,
      businessId: sub.business_id,
      businessName: biz?.name ?? 'Unknown',
      ownerEmail: biz?.ownerEmail ?? null,
      upgradedAt: upgradeDateMap.get(sub.business_id) ?? sub.updated_at ?? '',
      planName: enterprisePlan.display_name,
      hasBooking: sub.module_booking_override ?? planHasBooking,
      hasPos: sub.module_pos_override ?? planHasPos,
    };
  });

  return NextResponse.json(accounts);
}
