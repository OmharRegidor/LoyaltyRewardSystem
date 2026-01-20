// apps/web/app/api/billing/reactivate/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { resumeRecurringSubscription } from '@/lib/xendit';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST() {
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
                cookieStore.set(name, value, options),
              );
            } catch {}
          },
        },
      },
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
        { status: 404 },
      );
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('xendit_subscription_id, cancel_at_period_end')
      .eq('business_id', business.id)
      .single();

    if (!subscription?.xendit_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 },
      );
    }

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 },
      );
    }

    // Resume in Xendit (if it's a recurring subscription)
    try {
      await resumeRecurringSubscription(subscription.xendit_subscription_id);
    } catch (error) {
      // May fail if it's an invoice-based subscription, continue anyway
    }

    // Update database
    await serviceSupabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        canceled_at: null,
        cancellation_reason: null,
        cancellation_feedback: null,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', business.id);

    // Log
    await serviceSupabase.from('audit_logs').insert({
      event_type: 'subscription_reactivated',
      severity: 'info',
      business_id: business.id,
      user_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Reactivate error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to reactivate';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
