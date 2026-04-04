// apps/web/app/api/dashboard/pos/services/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server';
import { requireModule } from '@/lib/feature-gate';
import { getServices, createService } from '@/lib/services/service-catalog.service';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CreateServiceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  price: z.number().nonnegative(),
  pricing_type: z.enum(['fixed', 'per_hour', 'per_session', 'per_person', 'per_night', 'per_day', 'starting_at']).default('fixed'),
  duration_minutes: z.number().int().positive().default(30),
  duration_unit: z.enum(['minutes', 'hours', 'days', 'nights']).default('minutes'),
  category: z.string().max(100).optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean().default(true),
  max_guests: z.number().int().positive().optional(),
  allow_staff_selection: z.boolean().default(false),
  staff_ids: z.array(z.string().uuid()).optional(),
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
// GET: List Services
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

    await requireModule(businessId, 'pos');

    const services = await getServices(businessId);

    return NextResponse.json({ services });
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const err = error as Error & { code: string };
      if (err.code === 'MODULE_NOT_AVAILABLE') {
        return NextResponse.json(
          { error: 'POS module not available. Upgrade to Enterprise plan.' },
          { status: 403 }
        );
      }
    }

    console.error('GET /api/dashboard/pos/services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST: Create Service
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

    await requireModule(businessId, 'pos');

    const body = await request.json();
    const validation = CreateServiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const service = await createService(businessId, validation.data);

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('POST /api/dashboard/pos/services error:', error);

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
