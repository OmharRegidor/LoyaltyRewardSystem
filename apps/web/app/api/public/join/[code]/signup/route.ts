// apps/web/app/api/public/join/[code]/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBusinessByJoinCode } from '@/lib/services/public-business.service';
import { createSelfSignupCustomer } from '@/lib/services/public-business.service';
import { hasVerifiedCode } from '@/lib/services/verification.service';
import { createServiceClient } from '@/lib/supabase-server';
import type { Json } from '../../../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION
// ============================================

const JoinSignupSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  email: z.string().email('Invalid email address'),
});

// ============================================
// POST: Create verified customer
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const startTime = Date.now();
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    const { code: joinCode } = await params;

    // 1. Validate join code
    const business = await getBusinessByJoinCode(joinCode);
    if (!business) {
      return NextResponse.json(
        { error: 'Invalid join code' },
        { status: 404 },
      );
    }

    // 2. Parse and validate input
    const body = await request.json();
    const validation = JoinSignupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { fullName, phone, email } = validation.data;

    // 3. Require email verification
    const verified = await hasVerifiedCode(email, business.id);
    if (!verified) {
      return NextResponse.json(
        { error: 'Email not verified. Please complete verification first.' },
        { status: 403 },
      );
    }

    // 4. Check if customer already exists for this business (one-time invite)
    const serviceClient = createServiceClient();
    const { data: existingCustomer } = await serviceClient
      .from('customers')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('created_by_business_id', business.id)
      .maybeSingle();

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'You are already a member of this loyalty program.' },
        { status: 409 },
      );
    }

    // 5. Rate limit by IP
    const { data: rateLimitOk } = await serviceClient.rpc('check_rate_limit', {
      p_identifier: ipAddress,
      p_identifier_type: 'ip_address',
      p_action: 'join_signup',
      p_max_requests: 5,
      p_window_seconds: 3600,
    });

    if (rateLimitOk === false) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 },
      );
    }

    // 5. Create or find customer (reuse existing logic)
    const result = await createSelfSignupCustomer(
      business.id,
      fullName,
      phone,
      email,
    );

    // 6. Mark customer as verified (columns added via migration, not yet in generated types)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceClient as any)
      .from('customers')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_method: 'email_otp',
      })
      .eq('id', result.customerId);

    // 7. Fetch customer data for response
    let tier = 'bronze';
    let totalPoints = 0;
    let storedName = fullName;

    const { data: customerData } = await serviceClient
      .from('customers')
      .select('tier, total_points, full_name')
      .eq('id', result.customerId)
      .single();

    if (customerData) {
      tier = customerData.tier || 'bronze';
      totalPoints = customerData.total_points || 0;
      storedName = customerData.full_name || fullName;
    }

    // 8. Name mismatch check for existing customers
    if (!result.isNewCustomer) {
      const normalizedInput = fullName.trim().toLowerCase();
      const normalizedStored = storedName.trim().toLowerCase();

      if (normalizedInput !== normalizedStored) {
        return NextResponse.json(
          {
            error:
              'This phone number is already registered under a different name.',
          },
          { status: 409 },
        );
      }
    }

    // 9. Audit log
    await serviceClient.from('audit_logs').insert({
      event_type: result.isNewCustomer
        ? 'customer_verified_signup'
        : 'customer_verified_signup_existing',
      severity: 'info',
      business_id: business.id,
      user_id: null,
      details: {
        customerId: result.customerId,
        isNewCustomer: result.isNewCustomer,
        verificationMethod: 'email_otp',
        processingTimeMs: Date.now() - startTime,
        ipAddress,
      } as Json,
    });

    return NextResponse.json({
      success: true,
      data: {
        isNewCustomer: result.isNewCustomer,
        customerName: result.isNewCustomer ? fullName : storedName,
        qrCodeUrl: result.qrCodeUrl,
        tier,
        totalPoints,
      },
    });
  } catch (error) {
    console.error('Join signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
