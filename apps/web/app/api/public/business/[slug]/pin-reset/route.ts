// apps/web/app/api/public/business/[slug]/pin-reset/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  getBusinessBySlug,
  getCustomerByPhone,
} from '@/lib/services/public-business.service';
import { sendEmailVerification } from '@/lib/services/verification.service';
import { z } from 'zod';
import type { Json } from '../../../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const PinResetRequestSchema = z.object({
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  email: z.string().email('Please enter a valid email address'),
});

// ============================================
// CONSTANTS
// ============================================

const RATE_LIMIT = {
  maxRequests: 3,
  windowSeconds: 3600,
};

const ARTIFICIAL_DELAY_MS = { min: 800, max: 1500 };

// ============================================
// HELPERS
// ============================================

async function checkRateLimit(
  supabase: ReturnType<typeof createServiceClient>,
  ipAddress: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: ipAddress,
    p_identifier_type: 'ip_address',
    p_action: 'pin_reset',
    p_max_requests: RATE_LIMIT.maxRequests,
    p_window_seconds: RATE_LIMIT.windowSeconds,
  });

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

function artificialDelay(): Promise<void> {
  const ms =
    Math.floor(Math.random() * (ARTIFICIAL_DELAY_MS.max - ARTIFICIAL_DELAY_MS.min)) +
    ARTIFICIAL_DELAY_MS.min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// POST: Request PIN Reset (send OTP to email)
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    const { slug } = await params;

    const business = await getBusinessBySlug(slug);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const serviceClient = createServiceClient();

    const withinLimit = await checkRateLimit(serviceClient, ipAddress);
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again in an hour.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = PinResetRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone, email } = validation.data;

    // Look up customer by phone
    const customer = await getCustomerByPhone(business.id, phone);

    // Verify email matches (prevent enumeration by always responding the same)
    if (!customer || !customer.email || customer.email.toLowerCase() !== email.toLowerCase().trim()) {
      await artificialDelay();
      // Generic success to prevent enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that phone and email, a verification code has been sent.',
      });
    }

    // Send OTP
    const otpResult = await sendEmailVerification(
      email,
      business.id,
      business.name,
      'pin_reset'
    );

    await logAuditEvent(serviceClient, {
      action: 'pin_reset_otp_sent',
      businessId: business.id,
      details: {
        customerId: customer.id,
        otpSent: otpResult.success,
        ipAddress,
      },
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error || 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that phone and email, a verification code has been sent.',
    });
  } catch (error) {
    console.error('PIN reset request error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
