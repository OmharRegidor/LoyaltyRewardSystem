// apps/web/app/api/dashboard/pos/sales/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server';
import { requireModule } from '@/lib/feature-gate';
import { createSale, getSales } from '@/lib/services/pos.service';
import { z } from 'zod';
import type { PaymentMethod, DiscountType, SalesFilter } from '@/types/pos.types';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const SaleItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  unit_price_centavos: z.number().int().nonnegative(),
});

const CreateSaleSchema = z.object({
  items: z.array(SaleItemSchema).min(1),
  customer_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  discount_centavos: z.number().int().nonnegative().optional(),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_reason: z.string().max(255).optional(),
  payment_method: z.literal('cash'),
  payment_reference: z.string().max(100).optional(),
  amount_tendered_centavos: z.number().int().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});

// ============================================
// HELPER: Get Business ID
// ============================================

async function getBusinessId(userId: string): Promise<string | null> {
  const supabase = createServiceClient();

  // Check if user is business owner
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) return business.id;

  // Check if user is staff
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

  // Check if business owner
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) return userId; // Return user ID for owner

  // Get staff record
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
// GET: List Sales
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filter: SalesFilter = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      payment_method: searchParams.get('payment_method') as PaymentMethod | undefined,
      status: searchParams.get('status') as 'completed' | 'voided' | undefined,
      customer_id: searchParams.get('customer_id') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const sales = await getSales(businessId, filter);

    return NextResponse.json({ sales });
  } catch (error) {
    console.error('GET /api/dashboard/pos/sales error:', error);

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
// POST: Create Sale
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

    // Check POS module access
    await requireModule(businessId, 'pos');

    // Get staff ID
    const staffId = await getStaffId(user.id, businessId);

    // Parse and validate input
    const body = await request.json();
    const validation = CreateSaleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // Create the sale
    const sale = await createSale({
      business_id: businessId,
      branch_id: input.branch_id,
      customer_id: input.customer_id,
      staff_id: staffId || undefined,
      items: input.items,
      discount_centavos: input.discount_centavos,
      discount_type: input.discount_type as DiscountType | undefined,
      discount_reason: input.discount_reason,
      payment_method: input.payment_method as PaymentMethod,
      payment_reference: input.payment_reference,
      amount_tendered_centavos: input.amount_tendered_centavos,
      notes: input.notes,
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error('POST /api/dashboard/pos/sales error:', error);

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
