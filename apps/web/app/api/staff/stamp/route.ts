// apps/web/app/api/staff/stamp/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase-server';
import { createSupabaseFromCookies, verifyStaffAccess } from '@/lib/staff-auth';

const StampSchema = z.object({
  customerId: z.string().uuid('customerId must be a valid UUID'),
  saleId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseFromCookies(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idempotencyKey = request.headers.get('x-idempotency-key');

    const body = await request.json();
    const parsed = StampSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const { customerId, saleId, notes } = parsed.data;

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
      p_sale_id: saleId ?? undefined,
      p_notes: notes ?? undefined,
      p_idempotency_key: idempotencyKey ?? undefined,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add stamp';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
