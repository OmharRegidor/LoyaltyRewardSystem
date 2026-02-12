// apps/web/app/api/public/business/[slug]/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  getBusinessBySlug,
  createSelfSignupCustomer,
} from '@/lib/services/public-business.service';
import { z } from 'zod';
import type { Json } from '../../../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const SelfSignupSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
});

// ============================================
// RATE LIMIT CONSTANTS
// ============================================

const RATE_LIMIT = {
  maxRequests: 5,
  windowSeconds: 3600, // 1 hour
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
    p_action: 'self_signup',
    p_max_requests: RATE_LIMIT.maxRequests,
    p_window_seconds: RATE_LIMIT.windowSeconds,
  });

  // If RPC fails, allow the request (fail-open for better UX)
  if (error) {
    console.error('Rate limit check failed:', error);
    return true;
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
// POST: Self-Signup
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
        action: 'self_signup_rate_limited',
        businessId: business.id,
        details: {
          reason: 'rate_limit_exceeded',
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        {
          error:
            'Too many signup attempts. Please try again in an hour.',
        },
        { status: 429 }
      );
    }

    // 3. Parse and validate input
    const body = await request.json();
    const validation = SelfSignupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { fullName, phone, email } = validation.data;

    // 4. Create or find customer
    const result = await createSelfSignupCustomer(
      business.id,
      fullName,
      phone,
      email,
    );

    // 5. Fetch customer data for response (non-critical)
    let tier = 'bronze';
    let totalPoints = 0;
    let storedName = fullName;

    try {
      const { data: customerData, error: fetchError } = await serviceClient
        .from('customers')
        .select('tier, total_points, full_name')
        .eq('id', result.customerId)
        .single();

      if (!fetchError && customerData) {
        tier = customerData.tier || 'bronze';
        totalPoints = customerData.total_points || 0;
        storedName = customerData.full_name || fullName;
      }
    } catch (fetchErr) {
      console.error('Failed to fetch customer data after signup:', fetchErr);
    }

    // 5b. Reject if existing customer's name doesn't match
    if (!result.isNewCustomer) {
      const normalizedInput = fullName.trim().toLowerCase();
      const normalizedStored = storedName.trim().toLowerCase();

      if (normalizedInput !== normalizedStored) {
        return NextResponse.json(
          { error: 'This phone number is already registered. Use "View My Card" to access your existing card.' },
          { status: 409 }
        );
      }
    }

    // 6. Log audit event (non-critical)
    try {
      await logAuditEvent(serviceClient, {
        action: result.isNewCustomer
          ? 'customer_self_signup'
          : 'customer_self_signup_existing',
        businessId: business.id,
        details: {
          customerId: result.customerId,
          isNewCustomer: result.isNewCustomer,
          processingTimeMs: Date.now() - startTime,
          ipAddress,
          userAgent,
        },
      });
    } catch (auditErr) {
      console.error('Failed to log audit event:', auditErr);
    }

    // 7. Return success response with card data
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
    console.error('Self-signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
