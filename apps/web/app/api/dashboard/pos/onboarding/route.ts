// apps/web/app/api/dashboard/pos/onboarding/route.ts

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

  return business?.id || null;
}

// ============================================
// POST: Complete POS Onboarding
// ============================================

export async function POST(request: NextRequest) {
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
    const { business_type, pos_mode } = body as { business_type?: string; pos_mode?: string };

    if (!business_type || typeof business_type !== 'string') {
      return NextResponse.json(
        { error: 'business_type is required' },
        { status: 400 }
      );
    }

    // Derive pos_mode from business_type if not explicitly provided
    const validModes = ['products', 'services', 'both'];
    const SERVICE_TYPES = ['salon', 'barbershop', 'healthcare', 'hotel'];
    const PRODUCT_TYPES = ['retail', 'restaurant', 'rice_business'];
    const derivedMode = pos_mode && validModes.includes(pos_mode)
      ? pos_mode
      : SERVICE_TYPES.includes(business_type) ? 'services'
      : PRODUCT_TYPES.includes(business_type) ? 'products'
      : 'both';

    const supabase = createServiceClient();
    // Update business_type + pos_onboarded via typed query
    const { error } = await supabase
      .from('businesses')
      .update({
        business_type,
        pos_onboarded: true,
      })
      .eq('id', businessId);

    // Update pos_mode separately (may not be in generated types)
    if (!error) {
      await (supabase as unknown as { from: (t: string) => { update: (d: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> } } })
        .from('businesses')
        .update({ pos_mode: derivedMode })
        .eq('id', businessId);
    }

    if (error) {
      console.error('Error completing POS onboarding:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/dashboard/pos/onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
