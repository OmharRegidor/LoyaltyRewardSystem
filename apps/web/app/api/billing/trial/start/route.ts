import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase-server';

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
                cookieStore.set(name, value, options)
              );
            } catch {
              // Cookie setting may fail in certain contexts
            }
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
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const service = createServiceClient();

    // Check existing subscription
    const { data: existingSub } = await service
      .from('subscriptions')
      .select('id, status, trial_ends_at, plan_id, plans:plan_id(name)')
      .eq('business_id', business.id)
      .maybeSingle();

    // Guard: already used trial
    if (existingSub?.trial_ends_at) {
      return NextResponse.json(
        { error: 'You have already used your free trial' },
        { status: 400 }
      );
    }

    // Guard: already on enterprise (active paid plan)
    if (
      existingSub &&
      existingSub.status === 'active' &&
      existingSub.plans &&
      (existingSub.plans as unknown as { name: string }).name !== 'free'
    ) {
      return NextResponse.json(
        { error: 'You already have an active Enterprise subscription' },
        { status: 400 }
      );
    }

    // Find enterprise plan
    const { data: enterprisePlan } = await service
      .from('plans')
      .select('id')
      .eq('name', 'enterprise')
      .single();

    if (!enterprisePlan) {
      return NextResponse.json(
        { error: 'Enterprise plan not found' },
        { status: 500 }
      );
    }

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Upsert subscription with trial status
    const { error: upsertError } = await service
      .from('subscriptions')
      .upsert(
        {
          ...(existingSub?.id ? { id: existingSub.id } : {}),
          business_id: business.id,
          plan_id: enterprisePlan.id,
          status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
          module_pos_override: true,
          billing_interval: 'annual',
        },
        { onConflict: 'business_id' }
      );

    if (upsertError) {
      console.error('Trial activation error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to activate trial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trialEndsAt: trialEndsAt.toISOString(),
    });
  } catch (error) {
    console.error('Trial start error:', error);
    return NextResponse.json(
      { error: 'Failed to start trial' },
      { status: 500 }
    );
  }
}
