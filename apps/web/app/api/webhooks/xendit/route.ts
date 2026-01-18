// apps/web/app/api/webhooks/xendit/route.ts
// Handles all Xendit webhook events for billing

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyWebhookSignature,
  mapXenditStatusToInternal,
  formatAmountFromXendit,
} from '@/lib/xendit';

// ============================================
// SUPABASE SERVICE CLIENT
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// WEBHOOK HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const callbackToken = request.headers.get('x-callback-token') || '';
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;

    // Verify webhook token (Xendit uses callback token, not signature)
    if (webhookToken && callbackToken !== webhookToken) {
      console.error('Invalid Xendit webhook token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const event = JSON.parse(payload);

    // Xendit sends different event structures
    // Check for invoice events (most common for billing)
    if (event.external_id && event.status) {
      await handleInvoiceEvent(event);
      return NextResponse.json({ received: true });
    }

    // Check for recurring events
    if (event.event) {
      const eventType = event.event;
      console.log('Xendit webhook received:', eventType);

      switch (eventType) {
        // Recurring/Subscription Events
        case 'recurring.plan.created':
          await handlePlanCreated(event.data);
          break;

        case 'recurring.subscription.created':
          await handleSubscriptionCreated(event.data);
          break;

        case 'recurring.subscription.activated':
          await handleSubscriptionActivated(event.data);
          break;

        case 'recurring.subscription.paused':
          await handleSubscriptionPaused(event.data);
          break;

        case 'recurring.subscription.resumed':
          await handleSubscriptionResumed(event.data);
          break;

        case 'recurring.subscription.stopped':
          await handleSubscriptionStopped(event.data);
          break;

        case 'recurring.cycle.succeeded':
          await handlePaymentSucceeded(event.data);
          break;

        case 'recurring.cycle.failed':
          await handlePaymentFailed(event.data);
          break;

        // Payment Method Events
        case 'payment_method.activated':
          await handlePaymentMethodActivated(event.data);
          break;

        default:
          console.log('Unhandled Xendit event:', eventType);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Xendit webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ============================================
// INVOICE EVENT HANDLER
// ============================================

async function handleInvoiceEvent(invoice: {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  payment_channel?: string;
}) {
  const externalId = invoice.external_id;
  const status = invoice.status;

  console.log(`Invoice ${invoice.id} status: ${status}`);

  // Extract business_id from external_id (format: business_id-timestamp)
  const businessId = externalId.split('-')[0];

  if (status === 'PAID' || status === 'SETTLED') {
    // Payment successful - activate subscription
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: calculatePeriodEnd(
          new Date().toISOString(),
          'MONTH'
        ),
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId);

    if (!error) {
      // Record payment
      await supabase.from('payment_history').insert({
        business_id: businessId,
        xendit_cycle_id: invoice.id,
        amount: formatAmountFromXendit(invoice.paid_amount || invoice.amount),
        currency: 'PHP',
        status: 'paid',
        paid_at: invoice.paid_at || new Date().toISOString(),
      });

      await logAuditEvent('payment_succeeded', businessId, invoice);
    }
  } else if (status === 'EXPIRED') {
    // Invoice expired - keep subscription pending
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)
      .eq('status', 'pending');

    await logAuditEvent('invoice_expired', businessId, invoice);
  }
}

// ============================================
// RECURRING EVENT HANDLERS
// ============================================

async function handlePlanCreated(data: { id: string }) {
  console.log('Plan created:', data.id);
}

async function handleSubscriptionCreated(data: {
  id: string;
  customer_id: string;
  metadata?: { business_id?: string; plan_id?: string };
}) {
  const businessId = data.metadata?.business_id;

  if (!businessId) {
    console.error('No business_id in subscription metadata');
    return;
  }

  await supabase.from('subscriptions').upsert(
    {
      business_id: businessId,
      xendit_subscription_id: data.id,
      xendit_customer_id: data.customer_id,
      status: 'pending',
      plan_id: data.metadata?.plan_id,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'business_id',
    }
  );

  await logAuditEvent('subscription_created', businessId, data);
}

async function handleSubscriptionActivated(data: {
  id: string;
  current_cycle?: { scheduled_timestamp?: string };
  schedule?: { interval?: string };
}) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: data.current_cycle?.scheduled_timestamp,
      current_period_end: data.current_cycle?.scheduled_timestamp
        ? calculatePeriodEnd(
            data.current_cycle.scheduled_timestamp,
            data.schedule?.interval
          )
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('xendit_subscription_id', data.id);

  if (error) {
    console.error('Failed to activate subscription:', error);
  }

  const businessId = await getBusinessIdFromSubscription(data.id);
  if (businessId) {
    await logAuditEvent('subscription_activated', businessId, data);
  }
}

async function handleSubscriptionPaused(data: { id: string }) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('xendit_subscription_id', data.id);

  const businessId = await getBusinessIdFromSubscription(data.id);
  if (businessId) {
    await logAuditEvent('subscription_paused', businessId, data);
  }
}

async function handleSubscriptionResumed(data: { id: string }) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('xendit_subscription_id', data.id);

  const businessId = await getBusinessIdFromSubscription(data.id);
  if (businessId) {
    await logAuditEvent('subscription_resumed', businessId, data);
  }
}

async function handleSubscriptionStopped(data: { id: string }) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('xendit_subscription_id', data.id);

  const businessId = await getBusinessIdFromSubscription(data.id);
  if (businessId) {
    await logAuditEvent('subscription_canceled', businessId, data);
  }
}

async function handlePaymentSucceeded(data: {
  id: string;
  subscription_id: string;
  amount: number;
  scheduled_timestamp?: string;
  completed_timestamp?: string;
  metadata?: { interval?: string };
}) {
  const subscriptionId = data.subscription_id;

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: data.scheduled_timestamp,
      current_period_end: calculatePeriodEnd(
        data.scheduled_timestamp || new Date().toISOString(),
        data.metadata?.interval
      ),
      updated_at: new Date().toISOString(),
    })
    .eq('xendit_subscription_id', subscriptionId);

  const businessId = await getBusinessIdFromSubscription(subscriptionId);
  if (businessId) {
    await supabase.from('payment_history').insert({
      business_id: businessId,
      xendit_cycle_id: data.id,
      xendit_subscription_id: subscriptionId,
      amount: formatAmountFromXendit(data.amount),
      currency: 'PHP',
      status: 'paid',
      paid_at: data.completed_timestamp || new Date().toISOString(),
    });

    await logAuditEvent('payment_succeeded', businessId, data);
  }
}

async function handlePaymentFailed(data: {
  id: string;
  subscription_id: string;
  amount: number;
  failure_reason?: string;
}) {
  const subscriptionId = data.subscription_id;

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('xendit_subscription_id', subscriptionId);

  const businessId = await getBusinessIdFromSubscription(subscriptionId);
  if (businessId) {
    await supabase.from('payment_history').insert({
      business_id: businessId,
      xendit_cycle_id: data.id,
      xendit_subscription_id: subscriptionId,
      amount: formatAmountFromXendit(data.amount),
      currency: 'PHP',
      status: 'failed',
      failure_reason: data.failure_reason,
    });

    await logAuditEvent('payment_failed', businessId, data);
  }
}

async function handlePaymentMethodActivated(data: {
  id: string;
  customer_id: string;
}) {
  const customerId = data.customer_id;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('business_id')
    .eq('xendit_customer_id', customerId)
    .single();

  if (subscription) {
    await supabase
      .from('businesses')
      .update({
        xendit_payment_method_id: data.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.business_id);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getBusinessIdFromSubscription(
  xenditSubscriptionId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('business_id')
    .eq('xendit_subscription_id', xenditSubscriptionId)
    .single();

  return data?.business_id || null;
}

function calculatePeriodEnd(startDate: string, interval?: string): string {
  const date = new Date(startDate);
  if (interval === 'YEAR' || interval === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}

async function logAuditEvent(
  eventType: string,
  businessId: string,
  data: unknown
) {
  await supabase.from('audit_logs').insert({
    event_type: eventType,
    severity: eventType.includes('failed') ? 'warning' : 'info',
    business_id: businessId,
    details: data,
  });
}
