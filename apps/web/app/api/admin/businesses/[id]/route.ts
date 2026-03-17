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
          id, plan_id, status, billing_interval, current_period_end,
          module_pos_override,
          plans ( id, display_name, has_pos, has_loyalty )
        )
      `,
      )
      .eq('id', id)
      .maybeSingle(),
    // Admin notes
    service
      .from('admin_notes')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false }),
    // Admin tags
    service.from('admin_tags').select('*').eq('business_id', id),
    // Plan change history
    service
      .from('admin_plan_changes')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false }),
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
    // Points issued in last 30 days
    service
      .from('transactions')
      .select('points')
      .eq('business_id', id)
      .eq('type', 'earn')
      .gte('created_at', thirtyDaysAgo),
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

  // Sum points issued in last 30 days
  const pointsIssued30d = (pointsIssued30dResult.data ?? []).reduce(
    (sum: number, t: { points: number }) => sum + (t.points ?? 0),
    0,
  );

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

  // Verify business exists and get owner_id
  const { data: business } = await service
    .from('businesses')
    .select('id, name, owner_id')
    .eq('id', id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  try {
    // Get IDs needed for cascading deletes
    const [salesRes, invoicesRes, customerBizRes, staffRes] = await Promise.all([
      service.from('sales').select('id').eq('business_id', id),
      service.from('manual_invoices').select('id').eq('business_id', id),
      service.from('customer_businesses').select('customer_id').eq('business_id', id),
      service.from('staff').select('id').eq('business_id', id),
    ]);

    const saleIds = (salesRes.data ?? []).map((s: { id: string }) => s.id);
    const invoiceIds = (invoicesRes.data ?? []).map((i: { id: string }) => i.id);
    const customerIds = (customerBizRes.data ?? []).map((c: { customer_id: string }) => c.customer_id);
    const staffIds = (staffRes.data ?? []).map((s: { id: string }) => s.id);

    // Layer 1: Deepest children (sale_items → sales, manual_invoice_payments → manual_invoices, staff_services → staff)
    if (saleIds.length > 0) {
      await service.from('sale_items').delete().in('sale_id', saleIds);
    }
    if (invoiceIds.length > 0) {
      await service.from('manual_invoice_payments').delete().in('invoice_id', invoiceIds);
    }
    if (staffIds.length > 0) {
      await (service.from as (table: string) => ReturnType<typeof service.from>)('staff_services').delete().in('staff_id', staffIds);
    }

    // Layer 2: Tables with business_id that are referenced by nothing or already cleared
    await service.from('stock_movements').delete().eq('business_id', id);
    await service.from('sales').delete().eq('business_id', id);
    await service.from('referral_completions').delete().eq('business_id', id);
    await service.from('scan_logs').delete().eq('business_id', id);
    await service.from('verification_codes').delete().eq('business_id', id);

    // Layer 3: Tables with FK to rewards/customers
    await service.from('redemptions').delete().eq('business_id', id);
    await service.from('transactions').delete().eq('business_id', id);
    await service.from('notifications').delete().eq('business_id', id);

    // Layer 4: push_tokens for customers of this business
    if (customerIds.length > 0) {
      await service.from('push_tokens').delete().in('customer_id', customerIds);
    }

    // Layer 5: rewards, referral_codes, customer_businesses
    await service.from('rewards').delete().eq('business_id', id);
    await service.from('referral_codes').delete().eq('business_id', id);
    await service.from('customer_businesses').delete().eq('business_id', id);

    // Layer 6: Nullify created_by_business_id on customers still linked to other businesses, delete orphans
    await service.from('customers').update({ created_by_business_id: null }).eq('created_by_business_id', id);
    if (customerIds.length > 0) {
      const { data: stillLinked } = await service
        .from('customer_businesses')
        .select('customer_id')
        .in('customer_id', customerIds);
      const stillLinkedIds = new Set((stillLinked ?? []).map((c: { customer_id: string }) => c.customer_id));
      const orphanIds = customerIds.filter((cid: string) => !stillLinkedIds.has(cid));
      if (orphanIds.length > 0) {
        await service.from('customers').delete().in('id', orphanIds);
      }
    }

    // Layer 7: staff_invites, staff (staff_services already cleared)
    await service.from('staff_invites').delete().eq('business_id', id);
    await service.from('staff').delete().eq('business_id', id);

    // Layer 8: Everything else
    await service.from('branches').delete().eq('business_id', id);
    await service.from('products').delete().eq('business_id', id);
    await service.from('manual_invoices').delete().eq('business_id', id);
    await service.from('invoices').delete().eq('business_id', id);
    await service.from('payment_history').delete().eq('business_id', id);
    await service.from('payments').delete().eq('business_id', id);
    await service.from('subscriptions').delete().eq('business_id', id);
    await service.from('upgrade_requests').delete().eq('business_id', id);
    await service.from('usage_tracking').delete().eq('business_id', id);
    await service.from('audit_logs').delete().eq('business_id', id);
    await service.from('admin_notes').delete().eq('business_id', id);
    await service.from('admin_tags').delete().eq('business_id', id);
    await service.from('admin_plan_changes').delete().eq('business_id', id);

    // Layer 9: Delete the business itself
    const { error: bizError } = await service
      .from('businesses')
      .delete()
      .eq('id', id);

    if (bizError) {
      return NextResponse.json(
        { error: `Failed to delete business: ${bizError.message}` },
        { status: 500 },
      );
    }

    // Delete the auth user if owner_id exists
    if (business.owner_id) {
      await service.auth.admin.deleteUser(business.owner_id);
    }

    return NextResponse.json({ success: true, name: business.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Delete failed: ${message}` },
      { status: 500 },
    );
  }
}
