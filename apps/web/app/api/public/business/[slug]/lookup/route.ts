// apps/web/app/api/public/business/[slug]/lookup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  getBusinessBySlug,
  getCustomerByPhone,
  getCustomerByEmail,
} from '@/lib/services/public-business.service';
import { verifyPin, PIN_MAX_ATTEMPTS, LOCKOUT_MINUTES } from '@/lib/services/pin.service';
import { z } from 'zod';
import type { Json } from '../../../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const PinLookupSchema = z.object({
  identifier: z.string().min(1, 'Phone number or email is required'),
  pin: z
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
// POST: Phone + PIN Lookup
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
    const validation = PinLookupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { identifier, pin } = validation.data;

    // 4. Detect identifier type and look up customer
    const isEmail = identifier.includes('@');
    const isPhone = /^\d{11}$/.test(identifier.replace(/\s+/g, ''));

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { error: 'Please enter a valid 11-digit phone number or email address.' },
        { status: 400 }
      );
    }

    const customer = isEmail
      ? await getCustomerByEmail(business.id, identifier)
      : await getCustomerByPhone(business.id, identifier.replace(/\s+/g, ''));

    if (!customer) {
      await artificialDelay();

      await logAuditEvent(serviceClient, {
        action: 'card_lookup_not_found',
        businessId: business.id,
        details: {
          lookupType: isEmail ? 'email' : 'phone',
          processingTimeMs: Date.now() - startTime,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        { error: isEmail
            ? 'No card found for this email. Please check the address or sign up first.'
            : 'No card found for this phone number. Please check the number or sign up first.'
        },
        { status: 404 }
      );
    }

    // 5. Check if customer has a PIN set
    if (!customer.pinHash) {
      return NextResponse.json(
        {
          needsPinSetup: true,
        },
        { status: 200 }
      );
    }

    // 6. Check lockout
    if (
      customer.failedPinAttempts >= PIN_MAX_ATTEMPTS &&
      customer.pinLockedUntil &&
      new Date(customer.pinLockedUntil) > new Date()
    ) {
      const minutesLeft = Math.ceil(
        (new Date(customer.pinLockedUntil).getTime() - Date.now()) / 60000
      );

      return NextResponse.json(
        { error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.` },
        { status: 429 }
      );
    }

    // 7. Verify PIN
    const pinValid = await verifyPin(pin, customer.pinHash);

    if (!pinValid) {
      const newAttempts = customer.failedPinAttempts + 1;
      const updateData: Record<string, unknown> = {
        failed_pin_attempts: newAttempts,
      };

      if (newAttempts >= PIN_MAX_ATTEMPTS) {
        updateData.pin_locked_until = new Date(
          Date.now() + LOCKOUT_MINUTES * 60 * 1000
        ).toISOString();
      }

      await serviceClient
        .from('customers')
        .update(updateData)
        .eq('id', customer.id);

      const remaining = PIN_MAX_ATTEMPTS - newAttempts;

      await logAuditEvent(serviceClient, {
        action: 'card_lookup_pin_failed',
        businessId: business.id,
        details: {
          customerId: customer.id,
          attemptsRemaining: remaining,
          processingTimeMs: Date.now() - startTime,
          ipAddress,
          userAgent,
        },
      });

      if (remaining <= 0) {
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: 'Incorrect PIN.',
          attemptsRemaining: remaining,
        },
        { status: 401 }
      );
    }

    // 8. PIN correct — reset failed attempts
    await serviceClient
      .from('customers')
      .update({ failed_pin_attempts: 0, pin_locked_until: null })
      .eq('id', customer.id);

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

    // Fetch business-specific points
    let businessPoints = customer.totalPoints;
    const { data: bpData } = await serviceClient
      .from('customer_businesses')
      .select('points')
      .eq('customer_id', customer.id)
      .eq('business_id', business.id)
      .maybeSingle();

    if (bpData) {
      businessPoints = bpData.points || 0;
    }

    // Fetch stamp card data for stamp-mode businesses
    let stampCardData = null;
    const { data: bizMode } = await serviceClient
      .from('businesses')
      .select('loyalty_mode')
      .eq('id', business.id)
      .single();

    if (bizMode?.loyalty_mode === 'stamps') {
      const { data: stampData } = await serviceClient.rpc('get_customer_stamp_cards', {
        p_customer_id: customer.id,
        p_business_id: business.id,
      });
      const cards = typeof stampData === 'string' ? JSON.parse(stampData) : stampData;
      if (Array.isArray(cards) && cards.length > 0) {
        const card = cards[0];
        stampCardData = {
          stamps_collected: card.stamps_collected,
          total_stamps: card.total_stamps,
          reward_title: card.reward_title,
          is_completed: card.is_completed,
          milestones: card.milestones || [],
          redeemed_milestones: card.redeemed_milestones || [],
          paused_at_milestone: card.paused_at_milestone || null,
          reward_image_url: card.reward_image_url || null,
        };
      }
    }

    // Get business logo for stamp card display
    const { data: bizInfo } = await serviceClient
      .from('businesses')
      .select('logo_url')
      .eq('id', business.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        customerName: customer.fullName,
        phone: customer.phone || null,
        qrCodeUrl: customer.qrCodeUrl,
        tier: customer.tier,
        totalPoints: businessPoints,
        stampCard: stampCardData,
        loyaltyMode: bizMode?.loyalty_mode || 'points',
        businessLogoUrl: bizInfo?.logo_url || null,
      },
    });
  } catch (error) {
    console.error('Phone+PIN lookup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
