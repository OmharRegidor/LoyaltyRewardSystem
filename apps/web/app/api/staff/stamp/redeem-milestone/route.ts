// apps/web/app/api/staff/stamp/redeem-milestone/route.ts

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
  const { data: staff } = await service
    .from('staff')
    .select('id, business_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (staff) return { staffId: staff.id, businessId: staff.business_id };

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
    const { stampCardId } = body;

    if (!stampCardId) {
      return NextResponse.json(
        { error: 'stampCardId is required' },
        { status: 400 }
      );
    }

    const service = createServiceClient();

    const access = await verifyStaffAccess(service, user.id);
    if (!access) {
      return NextResponse.json(
        { error: 'Not authorized as staff or business owner' },
        { status: 403 }
      );
    }

    // Verify the stamp card belongs to this staff's business
    const { data: card } = await service
      .from('stamp_cards')
      .select('business_id')
      .eq('id', stampCardId)
      .maybeSingle();

    if (!card || card.business_id !== access.businessId) {
      return NextResponse.json(
        { error: 'Stamp card not found or not in your business' },
        { status: 403 }
      );
    }

    // redeem_milestone RPC — type may not exist in generated types until db:types runs
    const { data, error } = await service.rpc('redeem_milestone' as never, {
      p_stamp_card_id: stampCardId,
      p_staff_id: access.staffId,
    } as never);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to redeem milestone';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
