// apps/web/app/api/public/business/[slug]/pin-reset/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { verifyCode } from '@/lib/services/verification.service';
import { hashPin } from '@/lib/services/pin.service';
import { z } from 'zod';
import type { Json } from '../../../../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const PinResetVerifySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
  newPin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d+$/, 'PIN must contain only digits'),
});

// ============================================
// CONSTANTS
// ============================================

const RATE_LIMIT = {
  maxRequests: 10,
  windowSeconds: 3600,
};

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
    p_action: 'pin_reset_verify',
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

// ============================================
// POST: Verify OTP + Set New PIN
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
        { error: 'Too many attempts. Please try again in an hour.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = PinResetVerifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, code, newPin } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    const verifyResult = await verifyCode(code, normalizedEmail, business.id);

    if (!verifyResult.success) {
      await logAuditEvent(serviceClient, {
        action: 'pin_reset_verify_failed',
        businessId: business.id,
        details: { attemptsRemaining: verifyResult.attemptsRemaining, ipAddress },
      });

      return NextResponse.json(
        {
          error: verifyResult.error || 'Invalid verification code.',
          attemptsRemaining: verifyResult.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    // Hash new PIN and update customer
    const pinHash = await hashPin(newPin);

    // Try business-scoped customer first
    let updateError = null;
    const { error: scopedError, count: scopedCount } = await serviceClient
      .from('customers')
      .update({
        pin_hash: pinHash,
        failed_pin_attempts: 0,
        pin_locked_until: null,
      })
      .eq('email', normalizedEmail)
      .eq('created_by_business_id', business.id);

    if (scopedError || scopedCount === 0) {
      // Fallback: find customer linked via customer_businesses
      const { data: linked } = await serviceClient
        .from('customer_businesses')
        .select('customer_id, customers!inner(id, email)')
        .eq('business_id', business.id);

      let linkedCustomerId: string | null = null;
      if (linked) {
        for (const link of linked) {
          const c = Array.isArray(link.customers) ? link.customers[0] : link.customers;
          if (c?.email?.toLowerCase() === normalizedEmail) {
            linkedCustomerId = c.id;
            break;
          }
        }
      }

      if (linkedCustomerId) {
        const { error: linkedError } = await serviceClient
          .from('customers')
          .update({
            pin_hash: pinHash,
            failed_pin_attempts: 0,
            pin_locked_until: null,
          })
          .eq('id', linkedCustomerId);
        updateError = linkedError;
      } else {
        updateError = scopedError || new Error('Customer not found');
      }
    }

    if (updateError) {
      console.error('Failed to update PIN:', updateError);
      return NextResponse.json(
        { error: 'Failed to update PIN. Please try again.' },
        { status: 500 }
      );
    }

    await logAuditEvent(serviceClient, {
      action: 'pin_reset_success',
      businessId: business.id,
      details: { ipAddress },
    });

    return NextResponse.json({
      success: true,
      message: 'PIN updated successfully.',
    });
  } catch (error) {
    console.error('PIN reset verify error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
