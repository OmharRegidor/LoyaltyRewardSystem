// apps/web/app/api/public/referral/validate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

// ============================================
// GET: Validate referral code
// ============================================

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code || code.length < 4 || code.length > 10) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  try {
    const serviceClient = createServiceClient();

    // Rate limit by IP
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const { data: rateLimitOk } = await serviceClient.rpc('check_rate_limit', {
      p_identifier: ipAddress,
      p_identifier_type: 'ip_address',
      p_action: 'referral_validate',
      p_max_requests: 20,
      p_window_seconds: 3600,
    });

    if (rateLimitOk === false) {
      return NextResponse.json(
        { valid: false, error: 'Too many requests' },
        { status: 429 },
      );
    }

    // Look up referral code with business and referrer info
    const { data: refCode, error } = await (serviceClient as any)
      .from('referral_codes')
      .select(`
        id,
        code,
        is_active,
        uses,
        max_uses,
        business:businesses!referral_codes_business_id_fkey (name),
        referrer:customers!referral_codes_customer_id_fkey (full_name)
      `)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !refCode) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    if (refCode.uses >= refCode.max_uses) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const businessName = refCode.business?.name || 'Unknown Business';
    const referrerFirstName = refCode.referrer?.full_name?.split(' ')[0] || 'Someone';

    return NextResponse.json({
      valid: true,
      businessName,
      referrerFirstName,
    });
  } catch (error) {
    console.error('Referral validation error:', error);
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
