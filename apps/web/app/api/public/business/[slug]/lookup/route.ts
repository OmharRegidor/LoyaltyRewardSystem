// apps/web/app/api/public/business/[slug]/lookup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  getBusinessBySlug,
  getCustomerByEmail,
  maskEmail,
} from '@/lib/services/public-business.service';
import { sendEmailVerification } from '@/lib/services/verification.service';
import { z } from 'zod';
import type { Json } from '../../../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const EmailLookupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// ============================================
// CONSTANTS
// ============================================

const RATE_LIMIT = {
  maxRequests: 5,
  windowSeconds: 3600,
};

// Artificial delay range (ms) to match OTP send timing
const ARTIFICIAL_DELAY_MS = { min: 800, max: 1500 };

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
    p_action: 'card_lookup',
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

function artificialDelay(): Promise<void> {
  const ms =
    Math.floor(Math.random() * (ARTIFICIAL_DELAY_MS.max - ARTIFICIAL_DELAY_MS.min)) +
    ARTIFICIAL_DELAY_MS.min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// POST: Phone Lookup — Step 1 (send OTP)
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
        action: 'card_lookup_rate_limited',
        businessId: business.id,
        details: { ipAddress, userAgent },
      });

      return NextResponse.json(
        { error: 'Too many lookup attempts. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // 3. Parse and validate input
    const body = await request.json();
    const validation = EmailLookupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // 4. Look up customer by email
    const customer = await getCustomerByEmail(business.id, email);

    // 5. If customer found, send OTP to the provided email
    if (customer) {
      const otpResult = await sendEmailVerification(
        email,
        business.id,
        business.name,
        'card_lookup'
      );

      await logAuditEvent(serviceClient, {
        action: 'card_lookup_otp_sent',
        businessId: business.id,
        details: {
          customerId: customer.id,
          otpSent: otpResult.success,
          processingTimeMs: Date.now() - startTime,
          ipAddress,
          userAgent,
        },
      });

      if (!otpResult.success) {
        return NextResponse.json({
          success: false,
          message: otpResult.error || 'Failed to send verification code. Please try again.',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'A verification code has been sent to your email.',
        maskedEmail: maskEmail(email),
      });
    }

    // 6. Customer not found — artificial delay + generic response
    await artificialDelay();

    await logAuditEvent(serviceClient, {
      action: 'card_lookup_not_found',
      businessId: business.id,
      details: {
        processingTimeMs: Date.now() - startTime,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      success: false,
      message: 'No card found for this email address. Please check the email or sign up first.',
    });
  } catch (error) {
    console.error('Email lookup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
