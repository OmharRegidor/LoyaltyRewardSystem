import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();

  // Determine role by checking businesses first, then staff
  const { data: business } = await service
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  let eventType: string;
  let businessId: string | null = null;

  if (business) {
    eventType = 'business_owner_login';
    businessId = business.id;
  } else {
    const { data: staff } = await service
      .from('staff')
      .select('id, business_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (staff) {
      eventType = 'staff_login';
      businessId = staff.business_id;
    } else {
      // Not a business owner or staff — skip tracking
      return NextResponse.json({ ok: true });
    }
  }

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';

  await service.from('audit_logs').insert({
    event_type: eventType,
    business_id: businessId,
    user_id: user.id,
    severity: 'info',
    details: {
      email: user.email,
      role: business ? 'business_owner' : 'staff',
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    },
  });

  return NextResponse.json({ ok: true });
}
