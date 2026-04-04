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

    return NextResponse.json({ business_type: business?.business_type || null });
  } catch (error) {
    console.error('GET /api/dashboard/pos/business-type error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
