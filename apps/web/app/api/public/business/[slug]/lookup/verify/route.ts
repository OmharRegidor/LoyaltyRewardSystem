// apps/web/app/api/public/business/[slug]/lookup/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  getBusinessBySlug,
  getCustomerByPhone,
} from '@/lib/services/public-business.service';
import { verifyCode } from '@/lib/services/verification.service';
import { z } from 'zod';
import type { Json } from '../../../../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const VerifySchema = z.object({
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

// ============================================
// CONSTANTS
// ============================================

const RATE_LIMIT = {
  maxRequests: 10,
  windowSeconds: 3600,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkRateLimit(
  supabase: ReturnType<typeof createServiceClient>,
  ipAddress: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: ipAddress,
    p_identifier_type: 'ip_address',
    p_action: 'card_lookup_verify',
    p_max_requests: RATE_LIMIT.maxRequests,
    p_window_seconds: RATE_LIMIT.windowSeconds,
  });

  if (error) {
    console.error('Rate limit check failed:', error);
    return true; // fail-open
  }

  return data === true;
}

async function logAuditEvent(
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    action: string;
    businessId: string;
    details: Record<string, unknown>;
  }
) {
  await supabase.from('audit_logs').insert({
    event_type: params.action,
    severity: 'info',
    business_id: params.businessId,
    user_id: null,
    details: params.details as Json,
  });
}

// ============================================
// POST: Verify OTP — Step 2 (return card data)
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now();
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const { slug } = await params;

    // 1. Get business by slug
    const business = await getBusinessBySlug(slug);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const serviceClient = createServiceClient();

    // 2. Rate limit by IP
    const withinLimit = await checkRateLimit(serviceClient, ipAddress);
    if (!withinLimit) {
      await logAuditEvent(serviceClient, {
        action: 'card_lookup_verify_rate_limited',
        businessId: business.id,
        details: { ipAddress, userAgent },
      });

      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // 3. Parse and validate input
    const body = await request.json();
    const validation = VerifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { phone, code } = validation.data;

    // 4. Look up customer to get email
    const customer = await getCustomerByPhone(business.id, phone);
    if (!customer?.email) {
      return NextResponse.json(
        { error: 'Verification failed. Please try looking up your card again.' },
        { status: 400 }
      );
    }

    // 5. Verify the OTP code
    const verifyResult = await verifyCode(code, customer.email, business.id);

    if (!verifyResult.success) {
      await logAuditEvent(serviceClient, {
        action: 'card_lookup_verify_failed',
        businessId: business.id,
        details: {
          customerId: customer.id,
          attemptsRemaining: verifyResult.attemptsRemaining,
          processingTimeMs: Date.now() - startTime,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        {
          error: verifyResult.error || 'Invalid verification code.',
          attemptsRemaining: verifyResult.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    // 6. OTP verified — return card data
    await logAuditEvent(serviceClient, {
      action: 'card_lookup_verified',
      businessId: business.id,
      details: {
        customerId: customer.id,
        processingTimeMs: Date.now() - startTime,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        customerName: customer.fullName,
        qrCodeUrl: customer.qrCodeUrl,
        tier: customer.tier,
        totalPoints: customer.totalPoints,
      },
    });
  } catch (error) {
    console.error('Lookup verify error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
