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
    const service = createServiceClient();

    // Accept Bearer token (preferred for client-initiated calls that follow
    // a Bearer-authed POS sale) and fall back to cookie session.
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    let userId: string | null = null;
    if (bearerToken) {
      // Isolate Bearer resolution: if the SDK throws (network blip, malformed
      // JWT) we want to fall through to cookie auth, not turn into a 500.
      try {
        const { data: { user: bearerUser }, error: bearerError } =
          await service.auth.getUser(bearerToken);
        if (bearerError) {
          console.warn('Bearer token rejected, falling back to cookie auth:', bearerError.message);
        } else {
          userId = bearerUser?.id ?? null;
        }
      } catch (bearerThrown) {
        console.warn('Bearer auth.getUser threw, falling back to cookie auth:', bearerThrown);
      }
    }
    if (!userId) {
      const cookieStore = await cookies();
      const cookieSupabase = createSupabaseFromCookies(cookieStore);
      const { data: { user: cookieUser } } = await cookieSupabase.auth.getUser();
      userId = cookieUser?.id ?? null;
    }
    if (!userId) {
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

    // Server-side staff/owner verification — derive businessId and staffId from auth
    const access = await verifyStaffAccess(service, userId);
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
    console.error('POST /api/staff/stamp error:', error);
    // Postgrest errors thrown from supabase-js are plain objects with a
    // `.message` field, not Error instances — preserve their text instead
    // of swallowing it as a generic fallback.
    let message = 'Failed to add stamp';
    if (error instanceof Error) {
      message = error.message;
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
