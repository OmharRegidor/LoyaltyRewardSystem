// apps/web/app/api/dashboard/stamp-template/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase-server';

function createSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
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
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
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
    const { data: template } = await service
      .from('stamp_card_templates')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .maybeSingle();

    return NextResponse.json({ template });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
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

    const body = await request.json();
    const {
      title,
      totalStamps,
      rewardTitle,
      rewardDescription,
      rewardImageUrl,
      minPurchaseAmount,
      autoReset,
    } = body;

    if (!rewardTitle || !totalStamps) {
      return NextResponse.json(
        { error: 'rewardTitle and totalStamps are required' },
        { status: 400 }
      );
    }

    if (totalStamps < 1 || totalStamps > 30) {
      return NextResponse.json(
        { error: 'totalStamps must be between 1 and 30' },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    // Check if active template exists
    const { data: existing } = await service
      .from('stamp_card_templates')
      .select('id')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .maybeSingle();

    const templateData = {
      business_id: business.id,
      title: title || 'Loyalty Card',
      total_stamps: totalStamps,
      reward_title: rewardTitle,
      reward_description: rewardDescription || null,
      reward_image_url: rewardImageUrl || null,
      min_purchase_amount: minPurchaseAmount || 0,
      auto_reset: autoReset !== false,
      is_active: true,
    };

    let template;
    if (existing) {
      const { data, error } = await service
        .from('stamp_card_templates')
        .update(templateData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      template = data;
    } else {
      const { data, error } = await service
        .from('stamp_card_templates')
        .insert(templateData)
        .select()
        .single();
      if (error) throw error;
      template = data;
    }

    return NextResponse.json({ template });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
