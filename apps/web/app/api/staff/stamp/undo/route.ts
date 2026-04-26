// apps/web/app/api/staff/stamp/undo/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase-server';
import { createSupabaseFromCookies, verifyStaffAccess } from '@/lib/staff-auth';

const UndoSchema = z.object({
  stampCardId: z.string().uuid('stampCardId must be a valid UUID'),
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

    const body = await request.json();
    const parsed = UndoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }
    const { stampCardId } = parsed.data;

    const service = createServiceClient();

    // Server-side staff/owner verification
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

    const { data, error } = await service.rpc('undo_last_stamp', {
      p_stamp_card_id: stampCardId,
      p_staff_id: access.staffId,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to undo stamp';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
