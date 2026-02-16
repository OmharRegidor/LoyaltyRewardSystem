import { NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import type { PlanChangeRow, PlanChangesResponse, PlanOption } from '@/lib/admin';

export async function GET() {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createAdminServiceClient();

  // Fetch plan changes, plans, and business names in parallel
  const [changesResult, plansResult] = await Promise.all([
    service
      .from('admin_plan_changes')
      .select('id, business_id, changed_by_email, old_plan_id, new_plan_id, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    service
      .from('plans')
      .select('id, name, display_name, price_monthly, price_annual')
      .order('price_monthly', { ascending: true }),
  ]);

  if (changesResult.error) {
    return NextResponse.json({ error: 'Failed to fetch plan changes' }, { status: 500 });
  }

  interface RawChange {
    id: string;
    business_id: string;
    changed_by_email: string;
    old_plan_id: string | null;
    new_plan_id: string | null;
    reason: string | null;
    created_at: string;
  }

  const rawChanges = (changesResult.data ?? []) as RawChange[];
  const plans = (plansResult.data ?? []) as PlanOption[];

  // Build plan name lookup
  const planMap = new Map<string, string>();
  for (const p of plans) {
    planMap.set(p.id, p.display_name);
  }

  // Get unique business IDs and fetch names
  const businessIds = [...new Set(rawChanges.map((c) => c.business_id))];
  const businessNameMap = new Map<string, string>();

  if (businessIds.length > 0) {
    const { data: businesses } = await service
      .from('businesses')
      .select('id, name')
      .in('id', businessIds);

    for (const b of businesses ?? []) {
      businessNameMap.set(b.id, b.name);
    }
  }

  const changes: PlanChangeRow[] = rawChanges.map((c) => ({
    id: c.id,
    businessId: c.business_id,
    businessName: businessNameMap.get(c.business_id) ?? 'Unknown',
    oldPlanName: c.old_plan_id ? (planMap.get(c.old_plan_id) ?? 'Unknown') : null,
    newPlanName: c.new_plan_id ? (planMap.get(c.new_plan_id) ?? 'Unknown') : null,
    changedByEmail: c.changed_by_email,
    reason: c.reason,
    createdAt: c.created_at,
  }));

  const response: PlanChangesResponse = { changes, plans };

  return NextResponse.json(response);
}
