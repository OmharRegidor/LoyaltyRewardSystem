// apps/web/app/api/dashboard/pos/sales/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server';
import { requireModule } from '@/lib/feature-gate';
import { getSaleById, voidSale } from '@/lib/services/pos.service';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const VoidSaleSchema = z.object({
  void_reason: z.string().min(1).max(500),
});

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

async function getStaffId(userId: string, businessId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) return userId;

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .maybeSingle();

  return staff?.id || null;
}

// ============================================
// GET: Get Single Sale
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const sale = await getSaleById(id);

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Verify sale belongs to this business
    if (sale.business_id !== businessId) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('GET /api/dashboard/pos/sales/[id] error:', error);

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

// ============================================
// PATCH: Void Sale
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Get staff ID for voided_by
    const staffId = await getStaffId(user.id, businessId);
    if (!staffId) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    // Verify sale exists and belongs to this business
    const existingSale = await getSaleById(id);
    if (!existingSale || existingSale.business_id !== businessId) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Parse and validate input
    const body = await request.json();
    const validation = VoidSaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sale = await voidSale({
      sale_id: id,
      void_reason: validation.data.void_reason,
      voided_by: staffId,
    });

    return NextResponse.json({ sale });
  } catch (error) {
    console.error('PATCH /api/dashboard/pos/sales/[id] error:', error);

    if (error instanceof Error) {
      if (error.message === 'Sale is already voided') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if ('code' in error) {
        const err = error as Error & { code: string };
        if (err.code === 'MODULE_NOT_AVAILABLE') {
          return NextResponse.json(
            { error: 'POS module not available. Upgrade to Enterprise plan.' },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
