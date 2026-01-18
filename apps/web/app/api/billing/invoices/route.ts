// apps/web/app/api/billing/invoices/route.ts

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

    // Get payment history from database
    const { data: payments, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    const invoices = (payments || []).map((payment) => ({
      id: payment.id,
      number: `INV-${payment.id.slice(0, 8).toUpperCase()}`,
      date: payment.paid_at || payment.created_at,
      amount: payment.amount,
      currency: payment.currency || 'PHP',
      status: payment.status,
      xenditCycleId: payment.xendit_cycle_id,
    }));

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get invoices' },
      { status: 500 }
    );
  }
}
