// apps/web/app/api/staff/stamp/route.ts

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

async function verifyStaffAccess(service: ReturnType<typeof createServiceClient>, userId: string) {
  // Check staff first
  const { data: staff } = await service
    .from('staff')
    .select('id, business_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (staff) return { staffId: staff.id, businessId: staff.business_id };

  // Check business owner
  const { data: business } = await service
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) return { staffId: userId, businessId: business.id };

  return null;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, saleId, notes } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    // Server-side staff/owner verification — derive businessId and staffId from auth
    const access = await verifyStaffAccess(service, user.id);
    if (!access) {
      return NextResponse.json(
        { error: 'Not authorized as staff or business owner' },
        { status: 403 }
      );
    }

    const { data, error } = await service.rpc('add_stamp', {
      p_customer_id: customerId,
      p_business_id: access.businessId,
      p_staff_id: access.staffId,
      p_sale_id: saleId || null,
      p_notes: notes || null,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add stamp';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
