// apps/web/app/api/public/business/[slug]/lookup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  getBusinessBySlug,
  getCustomerByPhone,
} from '@/lib/services/public-business.service';
import { z } from 'zod';
import type { Json } from '../../../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const PhoneLookupSchema = z.object({
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
});

// ============================================
// RATE LIMIT CONSTANTS
// ============================================

const RATE_LIMIT = {
  maxRequests: 10,
  windowSeconds: 3600, // 1 hour
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkRateLimit(
  supabase: ReturnType<typeof createServiceClient>,
  ipAddress: string
): Promise<boolean> {
  const { data } = await supabase.rpc('check_rate_limit', {
    p_identifier: ipAddress,
    p_identifier_type: 'ip_address',
    p_action: 'card_lookup',
    p_max_requests: RATE_LIMIT.maxRequests,
    p_window_seconds: RATE_LIMIT.windowSeconds,
  });

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
// POST: Phone Lookup
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

    // 2. Check rate limit
    const serviceClient = createServiceClient();
    const withinLimit = await checkRateLimit(serviceClient, ipAddress);

    if (!withinLimit) {
      await logAuditEvent(serviceClient, {
        action: 'card_lookup_rate_limited',
        businessId: business.id,
        details: {
          reason: 'rate_limit_exceeded',
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        {
          error: 'Too many lookup attempts. Please try again in an hour.',
        },
        { status: 429 }
      );
    }

    // 3. Parse and validate input
    const body = await request.json();
    const validation = PhoneLookupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { phone } = validation.data;

    // 4. Look up customer by phone
    const customer = await getCustomerByPhone(business.id, phone);

    if (!customer) {
      await logAuditEvent(serviceClient, {
        action: 'card_lookup_not_found',
        businessId: business.id,
        details: {
          phoneHash: phone.slice(-4), // Only log last 4 digits for privacy
          processingTimeMs: Date.now() - startTime,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'No card found for this phone number',
        },
        { status: 404 }
      );
    }

    // 5. Log audit event
    await logAuditEvent(serviceClient, {
      action: 'card_lookup_success',
      businessId: business.id,
      details: {
        customerId: customer.id,
        processingTimeMs: Date.now() - startTime,
        ipAddress,
        userAgent,
      },
    });

    // 6. Return success response with card data
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
    console.error('Phone lookup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
