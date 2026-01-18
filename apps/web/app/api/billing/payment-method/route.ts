// apps/web/app/api/billing/payment-method/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import {
  getPaymentMethod,
  getPaymentMethodDisplay,
  createCardPaymentMethod,
  createEWalletPaymentMethod,
} from '@/lib/xendit';
import { z } from 'zod';

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Retrieve current payment method
export async function GET() {
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
      .select('id, xendit_payment_method_id')
      .eq('owner_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (!business.xendit_payment_method_id) {
      return NextResponse.json({ paymentMethod: null });
    }

    try {
      const xenditPM = await getPaymentMethod(
        business.xendit_payment_method_id
      );
      const display = getPaymentMethodDisplay(xenditPM);

      return NextResponse.json({
        paymentMethod: {
          id: xenditPM.id,
          type: display.type,
          display: display.display,
          last4: display.last4,
          status: xenditPM.status,
        },
      });
    } catch {
      return NextResponse.json({ paymentMethod: null });
    }
  } catch (error: unknown) {
    console.error('Get payment method error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to get payment method';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Update payment method
const UpdatePaymentMethodSchema = z.object({
  type: z.enum(['card', 'gcash', 'maya']),
  card: z
    .object({
      number: z.string(),
      expiryMonth: z.string(),
      expiryYear: z.string(),
      cvv: z.string(),
      name: z.string(),
    })
    .optional(),
});

export async function POST(request: Request) {
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

    const body = await request.json();
    const validation = UpdatePaymentMethodSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { type, card } = validation.data;

    const { data: business } = await supabase
      .from('businesses')
      .select('id, xendit_customer_id')
      .eq('owner_id', user.id)
      .single();

    if (!business || !business.xendit_customer_id) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    let newPaymentMethod;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (type === 'card' && card) {
      newPaymentMethod = await createCardPaymentMethod({
        customerId: business.xendit_customer_id,
        cardNumber: card.number.replace(/\s/g, ''),
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        cvv: card.cvv,
        cardholderName: card.name,
        currency: 'PHP',
      });
    } else if (type === 'gcash' || type === 'maya') {
      newPaymentMethod = await createEWalletPaymentMethod({
        customerId: business.xendit_customer_id,
        channelCode: type === 'gcash' ? 'GCASH' : 'PAYMAYA',
        successReturnUrl: `${appUrl}/dashboard/settings/billing?pm_updated=true`,
        failureReturnUrl: `${appUrl}/dashboard/settings/billing?pm_failed=true`,
      });

      // E-wallet requires authorization
      if (newPaymentMethod.actions) {
        const authAction = newPaymentMethod.actions.find(
          (a) => a.action === 'AUTH'
        );
        if (authAction?.url) {
          return NextResponse.json({
            success: true,
            requiresAuth: true,
            authUrl: authAction.url,
          });
        }
      }
    }

    if (newPaymentMethod) {
      await serviceSupabase
        .from('businesses')
        .update({
          xendit_payment_method_id: newPaymentMethod.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id);

      return NextResponse.json({
        success: true,
        paymentMethod: {
          id: newPaymentMethod.id,
          type: type,
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    );
  } catch (error: unknown) {
    console.error('Update payment method error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to update payment method';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
