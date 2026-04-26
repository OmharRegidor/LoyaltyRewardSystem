// apps/web/app/api/dashboard/pos/business-type/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server';

// ============================================
// HELPER: Get Business ID
// ============================================

async function getBusinessId(userId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) return business.id;

  const { data: staff } = await supabase
    .from('staff')
    .select('business_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  return staff?.business_id || null;
}

// ============================================
// GET: Get Business Type
// ============================================

export async function GET(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = await getBusinessId(user.id);
    if (!businessId) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const supabase = createServiceClient();
    const { data: business, error } = await supabase
      .from('businesses')
      .select('business_type')
      .eq('id', businessId)
      .single();

    if (error) {
      console.error('Error fetching business type:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // pos_mode may not be in generated types yet — fetch separately
    const { data: modeData } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    const posMode = modeData ? (modeData as Record<string, unknown>).pos_mode as string | null : null;

    return NextResponse.json({
      business_type: business?.business_type || null,
      pos_mode: posMode || null,
    });
  } catch (error) {
    console.error('GET /api/dashboard/pos/business-type error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT: Update POS Mode
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = await getBusinessId(user.id);
    if (!businessId) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await request.json();
    const { pos_mode } = body as { pos_mode?: string };

    if (!pos_mode || !['products', 'services', 'both'].includes(pos_mode)) {
      return NextResponse.json({ error: 'pos_mode must be products, services, or both' }, { status: 400 });
    }

    const supabase = createServiceClient();
    // pos_mode may not be in generated types — use raw update
    await (supabase as unknown as { from: (t: string) => { update: (d: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: unknown }> } } })
      .from('businesses')
      .update({ pos_mode })
      .eq('id', businessId);

    return NextResponse.json({ success: true, pos_mode });
  } catch (error) {
    console.error('PUT /api/dashboard/pos/business-type error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
