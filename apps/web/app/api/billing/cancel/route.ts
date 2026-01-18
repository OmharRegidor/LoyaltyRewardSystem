// apps/web/app/api/billing/cancel/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cancelRecurringSubscription } from '@/lib/xendit';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    let reason: string | undefined;
    let feedback: string | undefined;

    try {
      const body = await request.json();
      reason = body.reason;
      feedback = body.feedback;
    } catch {}

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

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('xendit_subscription_id, status, current_period_end')
      .eq('business_id', business.id)
      .single();

    if (!subscription?.xendit_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 404 }
      );
    }

    // Cancel in Xendit (if it's a recurring subscription)
    try {
      await cancelRecurringSubscription(subscription.xendit_subscription_id);
    } catch (error) {
      // May fail if it's an invoice-based subscription, continue anyway
      console.log('Xendit cancel attempt:', error);
    }

    // Update database - mark as canceling, will end at period end
    await serviceSupabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
        cancellation_reason: reason,
        cancellation_feedback: feedback,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', business.id);

    // Log
    await serviceSupabase.from('audit_logs').insert({
      event_type: 'subscription_cancel_requested',
      severity: 'info',
      business_id: business.id,
      user_id: user.id,
      details: { reason, feedback },
    });

    return NextResponse.json({
      success: true,
      cancelAt: subscription.current_period_end,
    });
  } catch (error: unknown) {
    console.error('Cancel error:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
