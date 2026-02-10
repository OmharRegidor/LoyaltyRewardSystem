// apps/web/app/api/dashboard/pos/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server';
import { requireModule } from '@/lib/feature-gate';
import { getSalesAnalytics } from '@/lib/services/pos.service';

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
// GET: Get Sales Analytics
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

    // Check POS module access
    await requireModule(businessId, 'pos');

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];

    // Default to last 7 days
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 6);
    const startDate = searchParams.get('start_date') || defaultStartDate.toISOString().split('T')[0];

    const analytics = await getSalesAnalytics(businessId, startDate, endDate);

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('GET /api/dashboard/pos/analytics error:', error);

    if (error instanceof Error && 'code' in error) {
      const err = error as Error & { code: string };
      if (err.code === 'MODULE_NOT_AVAILABLE') {
        return NextResponse.json(
          { error: 'POS module not available. Upgrade to Enterprise plan.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
