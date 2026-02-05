// apps/web/app/api/billing/subscribe/route.ts
// Creates subscription for business (with test mode support)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ============================================
// VALIDATION
// ============================================

const SubscribeSchema = z.object({
  planId: z.string(),
  interval: z.enum(['monthly', 'annual']),
  testMode: z.boolean().optional(),
  paymentMethod: z.enum(['card', 'gcash', 'maya']).optional(),
  card: z
    .object({
      number: z.string(),
      expiryMonth: z.string(),
      expiryYear: z.string(),
      cvv: z.string(),
      name: z.string(),
    })
    .optional(),
  billingDetails: z
    .object({
      fullName: z.string(),
      email: z.string().email().optional(),
    })
    .optional(),
});

// ============================================
// PLAN CONFIGURATION
// ============================================

interface PlanConfig {
  name: string;
  displayName: string;
  priceMonthly: number;
  priceAnnual: number;
  limits: {
    customers: number | null;
    branches: number | null;
    staffPerBranch: number | null;
  };
  modules: {
    has_loyalty: boolean;
    has_booking: boolean;
    has_pos: boolean;
  };
}

const PLANS: Record<string, PlanConfig> = {
  free: {
    name: 'free',
    displayName: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    limits: {
      customers: null, // Unlimited
      branches: 3,
      staffPerBranch: 5,
    },
    modules: {
      has_loyalty: true,
      has_booking: false,
      has_pos: false,
    },
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    priceMonthly: 0, // Contact for pricing
    priceAnnual: 0,
    limits: {
      customers: null, // Unlimited
      branches: null, // Unlimited
      staffPerBranch: null, // Unlimited
    },
    modules: {
      has_loyalty: true,
      has_booking: true,
      has_pos: true,
    },
  },
};

// ============================================
// SUPABASE CLIENTS
// ============================================

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}

const getServiceSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// ============================================
// POST: Create Subscription
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const serviceSupabase = getServiceSupabase();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate request
    const body = await request.json();
    const validation = SubscribeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { planId, interval, testMode } = validation.data;

    // 3. Get plan
    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // 4. Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, owner_email')
      .eq('owner_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 },
      );
    }

    // 5. Check existing active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('business_id', business.id)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      return NextResponse.json(
        { error: 'Already has active subscription' },
        { status: 400 },
      );
    }

    // 6. Calculate dates
    const now = new Date();
    const periodEnd = new Date(now);
    if (interval === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // 7. Get or create plan in database
    const { data: existingPlan } = await serviceSupabase
      .from('plans')
      .select('id')
      .eq('name', planId)
      .single();

    let planId_db: string;

    if (existingPlan) {
      planId_db = existingPlan.id;
    } else {
      // Create plan if doesn't exist
      const { data: newPlan, error: createError } = await serviceSupabase
        .from('plans')
        .insert({
          name: plan.name,
          display_name: plan.displayName,
          price_monthly: plan.priceMonthly,
          price_annual: plan.priceAnnual,
          max_customers: plan.limits.customers,
          max_branches: plan.limits.branches,
          max_staff_per_branch: plan.limits.staffPerBranch,
          has_loyalty: plan.modules.has_loyalty,
          has_booking: plan.modules.has_booking,
          has_pos: plan.modules.has_pos,
          is_active: true,
        })
        .select('id')
        .single();

      if (createError || !newPlan) {
        return NextResponse.json(
          { error: 'Failed to create plan' },
          { status: 500 },
        );
      }

      planId_db = newPlan.id;
    }

    // 8. Handle TEST MODE - simulate successful payment
    if (testMode || !process.env.XENDIT_SECRET_KEY) {
      // Create subscription directly (bypassing Xendit)
      await serviceSupabase.from('subscriptions').upsert(
        {
          business_id: business.id,
          plan_id: planId_db,
          xendit_subscription_id: `test_${Date.now()}`,
          xendit_customer_id: `test_customer_${business.id}`,
          status: 'active',
          billing_interval: interval,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: now.toISOString(),
        },
        {
          onConflict: 'business_id',
        },
      );

      // Update plan limits
      await serviceSupabase.from('plan_limits').upsert(
        {
          business_id: business.id,
          max_customers: plan.limits.customers,
          max_branches: plan.limits.branches,
          max_staff_per_branch: plan.limits.staffPerBranch,
          updated_at: now.toISOString(),
        },
        {
          onConflict: 'business_id',
        },
      );

      // Record test payment
      await serviceSupabase.from('payment_history').insert({
        business_id: business.id,
        xendit_cycle_id: `test_payment_${Date.now()}`,
        amount: interval === 'annual' ? plan.priceAnnual : plan.priceMonthly,
        currency: 'PHP',
        status: 'paid',
        paid_at: now.toISOString(),
      });

      // Log audit event
      await serviceSupabase.from('audit_logs').insert({
        event_type: 'subscription_created_test_mode',
        severity: 'info',
        business_id: business.id,
        user_id: user.id,
        details: {
          plan: planId,
          interval,
          testMode: true,
        },
      });

      return NextResponse.json({
        success: true,
        testMode: true,
        status: 'active',
        message: 'Subscription activated (test mode)',
      });
    }

    // 9. PRODUCTION MODE - Use Xendit
    // Import Xendit functions dynamically to avoid errors when keys not set
    try {
      const { createCustomer, getCustomerByReferenceId, createInvoice } =
        await import('@/lib/xendit');

      // Get or create Xendit customer
      let xenditCustomerId = null;

      const existingCustomer = await getCustomerByReferenceId(business.id);
      if (existingCustomer) {
        xenditCustomerId = existingCustomer.id;
      } else {
        const newCustomer = await createCustomer({
          referenceId: business.id,
          email: user.email || business.owner_email,
          givenNames:
            validation.data.billingDetails?.fullName || 'Business Owner',
        });
        xenditCustomerId = newCustomer.id;
      }

      // Save customer ID
      await serviceSupabase
        .from('businesses')
        .update({ xendit_customer_id: xenditCustomerId })
        .eq('id', business.id);

      // Create invoice for first payment
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const externalId = `${business.id}-${Date.now()}`;
      const amount =
        interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;

      const invoice = await createInvoice({
        externalId,
        amount: amount / 100, // Convert centavos to pesos for Xendit
        description: `NoxaLoyalty ${plan.displayName} Plan - ${
          interval === 'annual' ? 'Annual' : 'Monthly'
        } Subscription`,
        customerEmail: user.email || business.owner_email,
        customerName: validation.data.billingDetails?.fullName,
        successRedirectUrl: `${appUrl}/dashboard/settings/billing?success=true`,
        failureRedirectUrl: `${appUrl}/dashboard/settings/billing?failed=true`,
        currency: 'PHP',
        invoiceDuration: 86400,
        metadata: {
          business_id: business.id,
          plan_id: planId,
          billing_interval: interval,
        },
      });

      // Save subscription as pending
      await serviceSupabase.from('subscriptions').upsert(
        {
          business_id: business.id,
          plan_id: planId_db,
          xendit_subscription_id: invoice.id,
          xendit_customer_id: xenditCustomerId,
          status: 'pending',
          billing_interval: interval,
          current_period_start: now.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          onConflict: 'business_id',
        },
      );

      return NextResponse.json({
        success: true,
        invoiceId: invoice.id,
        status: 'pending',
        paymentUrl: invoice.invoiceUrl,
        redirectUrl: invoice.invoiceUrl,
      });
    } catch (xenditError) {
      console.error('Xendit error:', xenditError);
      return NextResponse.json(
        { error: 'Payment processing failed. Please try again.' },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    console.error('Subscribe error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
