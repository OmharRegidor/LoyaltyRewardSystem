import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import type {
  AdminNote,
  AdminTag,
  AdminPlanChange,
  PlanOption,
  ActivityDataPoint,
  BusinessDetailResponse,
} from '@/lib/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const service = createAdminServiceClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Parallel fetch all data
  const [
    statsResult,
    businessResult,
    notesResult,
    tagsResult,
    planChangesResult,
    activityResult,
    plansResult,
    newCustomers30dResult,
    pointsIssued30dResult,
    activeRewardsResult,
  ] = await Promise.all([
    // admin_business_stats view
    service.from('admin_business_stats').select('*').eq('id', id).maybeSingle(),
    // Full business with subscription + plan (include feature flags)
    service
      .from('businesses')
      .select(
        `
        id, name, slug, owner_email, created_at, subscription_status,
        business_type, phone, city, address, logo_url, points_per_purchase,
        subscriptions (
          id, plan_id, status, billing_interval, current_period_start, current_period_end,
          module_pos_override,
          plans ( id, display_name, has_pos, has_loyalty )
        )
      `,
      )
      .eq('id', id)
      .maybeSingle(),
    // Admin notes (capped — older notes are still accessible via a paginated endpoint if needed)
    service
      .from('admin_notes')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
    // Admin tags
    service.from('admin_tags').select('*').eq('business_id', id).limit(200),
    // Plan change history
    service
      .from('admin_plan_changes')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
    // Activity trend RPC
    service.rpc('get_business_activity_trend', {
      p_business_id: id,
      p_days: 30,
    }),
    // All available plans
    service
      .from('plans')
      .select('id, name, display_name, price_monthly, price_annual')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true }),
    // New customers in last 30 days
    service
      .from('customer_businesses')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', id)
      .gte('followed_at', thirtyDaysAgo),
    // Points issued in last 30 days (DB-side aggregation)
    service.rpc('sum_business_points_30d', { p_business_id: id }),
    // Active rewards
    service
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', id)
      .eq('is_active', true),
  ]);

  if (!businessResult.data) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const biz = businessResult.data;
  const sub = Array.isArray(biz.subscriptions)
    ? biz.subscriptions[0]
    : biz.subscriptions;
  const planData = sub?.plans
    ? Array.isArray(sub.plans)
      ? sub.plans[0]
      : sub.plans
    : null;

  // Build plan lookup for resolving plan change IDs
  const planLookup = new Map<string, string>();
  if (plansResult.data) {
    for (const p of plansResult.data) {
      planLookup.set(p.id, p.display_name);
    }
  }

  // Resolve plan change display names
  const planChanges: AdminPlanChange[] = (planChangesResult.data ?? []).map(
    (pc: Record<string, unknown>) => ({
      id: pc.id as string,
      business_id: pc.business_id as string,
      changed_by_email: pc.changed_by_email as string,
      old_plan_id: (pc.old_plan_id as string) ?? null,
      new_plan_id: (pc.new_plan_id as string) ?? null,
      old_plan_name: pc.old_plan_id
        ? planLookup.get(pc.old_plan_id as string) ?? 'Unknown'
        : null,
      new_plan_name: pc.new_plan_id
        ? planLookup.get(pc.new_plan_id as string) ?? 'Unknown'
        : null,
      reason: (pc.reason as string) ?? null,
      created_at: pc.created_at as string,
    }),
  );

  const pointsIssued30d =
    typeof pointsIssued30dResult.data === 'number'
      ? pointsIssued30dResult.data
      : 0;

  const statsRow = statsResult.data;

  const response: BusinessDetailResponse = {
    business: {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      owner_email: biz.owner_email,
      created_at: biz.created_at,
      subscription_status: biz.subscription_status,
      business_type: biz.business_type,
      phone: biz.phone,
      city: biz.city,
      address: biz.address,
      logo_url: biz.logo_url,
      points_per_purchase: biz.points_per_purchase,
      plan_name: planData?.display_name ?? 'Free',
      billing_interval: sub?.billing_interval ?? null,
      current_period_start: sub?.current_period_start ?? null,
      current_period_end: sub?.current_period_end ?? null,
      current_plan_id: sub?.plan_id ?? null,
      has_pos: ((sub as Record<string, unknown>)?.module_pos_override as boolean | null) ??
        (planData as Record<string, unknown>)?.has_pos === true,
      has_loyalty: (planData as Record<string, unknown>)?.has_loyalty !== false,
    },
    stats: {
      customer_count: (statsRow?.customer_count as number) ?? 0,
      staff_count: (statsRow?.staff_count as number) ?? 0,
      transaction_count: (statsRow?.transaction_count as number) ?? 0,
      transactions_30d: (statsRow?.transactions_30d as number) ?? 0,
      branch_count: (statsRow?.branch_count as number) ?? 0,
      points_issued: (statsRow?.points_issued as number) ?? 0,
      new_customers_30d: newCustomers30dResult.count ?? 0,
      points_issued_30d: pointsIssued30d,
      active_rewards: activeRewardsResult.count ?? 0,
      last_active_at: (statsRow?.last_active_at as string) ?? null,
    },
    notes: (notesResult.data ?? []) as AdminNote[],
    tags: (tagsResult.data ?? []) as AdminTag[],
    planChanges,
    activityTrend: (activityResult.data ?? []) as ActivityDataPoint[],
    availablePlans: (plansResult.data ?? []) as PlanOption[],
  };

  return NextResponse.json(response);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const service = createAdminServiceClient();

  const { data, error } = await service.rpc('delete_business', {
    p_business_id: id,
    p_admin_email: user.email,
  });

  if (error) {
    const notFound = error.code === 'P0002' || /not found/i.test(error.message);
    return NextResponse.json(
      { error: notFound ? 'Business not found' : `Delete failed: ${error.message}` },
      { status: notFound ? 404 : 500 },
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  const ownerId = (row as { owner_id: string | null } | null)?.owner_id ?? null;
  const businessName = (row as { business_name: string | null } | null)?.business_name ?? '';

  if (ownerId) {
    const { error: authError } = await service.auth.admin.deleteUser(ownerId);
    if (authError && authError.status !== 404) {
      return NextResponse.json(
        {
          success: true,
          name: businessName,
          warning: `Business data deleted but owner auth cleanup failed: ${authError.message}`,
        },
        { status: 200 },
      );
    }
  }

  return NextResponse.json({ success: true, name: businessName });
}
