import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient, createAdminServiceClient } from '@/lib/supabase-server';

interface UpgradeRequestBody {
  screenshotUrl: string;
}

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

    const adminService = createAdminServiceClient();

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get latest upgrade request
    const { data: request } = await adminService
      .from('upgrade_requests')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ request });
  } catch (error) {
    console.error('Get upgrade request error:', error);
    return NextResponse.json(
      { error: 'Failed to get upgrade request' },
      { status: 500 }
    );
  }
}

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

    const body = (await request.json()) as UpgradeRequestBody;
    const { screenshotUrl } = body;

    if (!screenshotUrl || typeof screenshotUrl !== 'string') {
      return NextResponse.json(
        { error: 'screenshotUrl is required' },
        { status: 400 }
      );
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
    const adminService = createAdminServiceClient();

    // Check user is not already on a paid (enterprise) plan
    const { data: existingSub } = await service
      .from('subscriptions')
      .select('id, status, trial_ends_at, plan_id, plans:plan_id(name)')
      .eq('business_id', business.id)
      .maybeSingle();

    // Allow trial users (active or expired) to submit upgrade requests
    const isTrialUser = existingSub?.trial_ends_at !== null && existingSub?.trial_ends_at !== undefined;

    if (
      existingSub &&
      !isTrialUser &&
      ['active', 'trialing'].includes(existingSub.status) &&
      existingSub.plans &&
      (existingSub.plans as unknown as { name: string }).name !== 'free'
    ) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      );
    }

    // Check no pending request exists
    const { data: pendingRequest } = await adminService
      .from('upgrade_requests')
      .select('id')
      .eq('business_id', business.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending upgrade request' },
        { status: 400 }
      );
    }

    // Create upgrade request
    const { data: newRequest, error: insertError } = await adminService
      .from('upgrade_requests')
      .insert({
        business_id: business.id,
        owner_id: user.id,
        owner_email: user.email ?? '',
        screenshot_url: screenshotUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert upgrade request error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create upgrade request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error('Create upgrade request error:', error);
    return NextResponse.json(
      { error: 'Failed to create upgrade request' },
      { status: 500 }
    );
  }
}
