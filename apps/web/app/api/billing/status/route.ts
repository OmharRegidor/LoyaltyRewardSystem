// apps/web/app/api/billing/status/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient, createAdminServiceClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Get subscription with plan details
    // Use service role client to bypass RLS — user is already authenticated
    // and business ownership verified above
    const service = createServiceClient();
    const { data: subscription } = await service
      .from('subscriptions')
      .select(
        `
        *,
        plan:plans(*)
      `
      )
      .eq('business_id', business.id)
      .single();

    if (!subscription) {
      // Check for pending upgrade request (use admin client for extended types)
      const adminService = createAdminServiceClient();
      const { data: pendingUpgrade } = await adminService
        .from('upgrade_requests')
        .select('id')
        .eq('business_id', business.id)
        .eq('status', 'pending')
        .maybeSingle();

      // Free plan limits - matches landing page promises:
      // Unlimited customers, 3 branches, 5 staff per branch
      return NextResponse.json({
        status: 'free',
        hasAccess: true,
        isFreeForever: true,
        isAdminManaged: false,
        upgradeAcknowledged: true,
        pendingUpgradeRequest: !!pendingUpgrade,
        trialEndsAt: null,
        isTrialing: false,
        hasUsedTrial: false,
        trialDaysRemaining: null,
        isTrialExpired: false,
        plan: {
          id: 'free',
          name: 'free',
          displayName: 'Free',
          hasLoyalty: true,
          hasPOS: false,
        },
        limits: {
          customers: null, // Unlimited
          branches: 3,
          staff: 5,
        },
      });
    }

    // Get current usage (service client for consistent access)
    const [customersResult, branchesResult, staffResult] = await Promise.all([
      service
        .from('customer_businesses')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id),
      service
        .from('branches')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id),
      service
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id),
    ]);

    const usage = {
      customers: customersResult.count || 0,
      branches: branchesResult.count || 0,
      staff: staffResult.count || 0,
    };

    // Determine limits based on plan
    const limits = subscription.plan
      ? {
          customers: subscription.plan.max_customers || Infinity,
          branches: subscription.plan.max_branches || Infinity,
          staff: subscription.plan.max_staff_per_branch || Infinity,
        }
      : {
          customers: null, // Unlimited for free plan
          branches: 3,
          staff: 5,
        };

    const isTrialing = subscription.status === 'trialing';
    const trialEndsAt = subscription.trial_ends_at ?? null;
    const hasUsedTrial = trialEndsAt !== null;
    const isTrialExpired =
      isTrialing && trialEndsAt ? new Date(trialEndsAt) < new Date() : false;
    const trialDaysRemaining =
      isTrialing && trialEndsAt && !isTrialExpired
        ? Math.max(
            0,
            Math.ceil(
              (new Date(trialEndsAt).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null;

    const hasAccess = ['active', 'trialing'].includes(subscription.status);
    const isAdminManaged = !subscription.xendit_subscription_id;

    // Check for pending upgrade request and upgrade_acknowledged (use admin client for extended types)
    const adminService = createAdminServiceClient();
    const [{ data: pendingUpgrade }, { data: subExtra }] = await Promise.all([
      adminService
        .from('upgrade_requests')
        .select('id')
        .eq('business_id', business.id)
        .eq('status', 'pending')
        .maybeSingle(),
      adminService
        .from('subscriptions')
        .select('upgrade_acknowledged')
        .eq('business_id', business.id)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      status: subscription.status,
      hasAccess,
      isFreeForever: false,
      isAdminManaged,
      upgradeAcknowledged: subExtra?.upgrade_acknowledged ?? true,
      pendingUpgradeRequest: !!pendingUpgrade,
      trialEndsAt,
      isTrialing,
      hasUsedTrial,
      trialDaysRemaining,
      isTrialExpired,
      plan: subscription.plan
        ? {
            id: subscription.plan.id,
            name: subscription.plan.name,
            displayName: subscription.plan.display_name,
            hasLoyalty: subscription.plan.has_loyalty,
            hasPOS: isTrialExpired
              ? false
              : (subscription.module_pos_override ?? subscription.plan.has_pos),
          }
        : null,
      billingInterval: subscription.billing_interval,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      limits,
      usage,
    });
  } catch (error: any) {
    console.error('Get status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}
