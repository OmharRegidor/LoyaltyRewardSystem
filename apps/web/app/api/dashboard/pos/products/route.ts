// apps/web/app/api/dashboard/pos/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server';
import { requireModule } from '@/lib/feature-gate';
import { getProducts, createProduct } from '@/lib/services/pos.service';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  price: z.number().positive(), // In pesos
  category: z.string().max(100).optional(),
  sku: z.string().max(50).optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().nonnegative().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  low_stock_threshold: z.number().int().nonnegative().optional(),
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

// ============================================
// GET: List Products
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

    const products = await getProducts(businessId);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('GET /api/dashboard/pos/products error:', error);

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
// POST: Create Product
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

    // Parse and validate input
    const body = await request.json();
    const validation = CreateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const product = await createProduct(businessId, validation.data);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('POST /api/dashboard/pos/products error:', error);

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
