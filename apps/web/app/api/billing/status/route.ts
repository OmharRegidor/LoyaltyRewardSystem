// apps/web/app/api/billing/status/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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
    const { data: subscription } = await supabase
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
      return NextResponse.json({
        status: 'preview',
        hasAccess: false,
        plan: null,
        limits: {
          customers: 50,
          branches: 1,
          staff: 2,
        },
      });
    }

    // Get current usage
    const [customersResult, branchesResult, staffResult] = await Promise.all([
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id),
      supabase
        .from('branches')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id),
      supabase
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
          customers: 50,
          branches: 1,
          staff: 2,
        };

    const hasAccess =
      ['active', 'trialing'].includes(subscription.status) ||
      subscription.is_free_forever;

    return NextResponse.json({
      status: subscription.status,
      hasAccess,
      isFreeForever: subscription.is_free_forever || false,
      plan: subscription.plan
        ? {
            id: subscription.plan.id,
            name: subscription.plan.name,
            displayName: subscription.plan.display_name,
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
