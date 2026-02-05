// apps/web/app/api/public/business/[slug]/bookings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase-server';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { createPublicBooking } from '@/lib/services/public-booking.service';
import type { Json } from '../../../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const AddonSelectionSchema = z.object({
  addon_id: z.string().uuid('Invalid addon ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity too high'),
  option_id: z.string().uuid('Invalid option ID').optional().nullable(),
  option_price_centavos: z.number().int().min(0).optional().nullable(),
});

const CreateBookingSchema = z.object({
  service_id: z.string().uuid('Invalid service ID'),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Invalid time format')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .nullable(),
  nights: z.number().int().min(1).max(365).optional().nullable(),
  customer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  customer_phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .regex(/^[0-9]+$/, 'Phone number must contain only digits'),
  customer_email: z.string().email('Invalid email').optional().nullable(),
  notes: z.string().max(500, 'Notes are too long').optional().nullable(),
  // New fields for hotel/restaurant bookings
  variant_id: z.string().uuid('Invalid variant ID').optional().nullable(),
  party_size: z.number().int().min(1).max(100).optional().nullable(),
  guests_adults: z.number().int().min(1).max(50).optional().nullable(),
  guests_children: z.number().int().min(0).max(50).optional().nullable(),
  addons: z.array(AddonSelectionSchema).max(20, 'Too many add-ons').optional().nullable(),
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
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: ipAddress,
    p_identifier_type: 'ip_address',
    p_action: 'public_booking',
    p_max_requests: RATE_LIMIT.maxRequests,
    p_window_seconds: RATE_LIMIT.windowSeconds,
  });

  if (error) {
    console.error('Rate limit check failed:', error);
    return true; // Fail-open
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
// POST: Create booking
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
        action: 'public_booking_rate_limited',
        businessId: business.id,
        details: {
          reason: 'rate_limit_exceeded',
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        { error: 'Too many booking attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // 3. Parse and validate input
    const body = await request.json();
    const validation = CreateBookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 4. Create booking
    const result = await createPublicBooking({
      businessId: business.id,
      serviceId: data.service_id,
      bookingDate: data.booking_date,
      startTime: data.start_time,
      endDate: data.end_date || undefined,
      nights: data.nights || undefined,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerEmail: data.customer_email || undefined,
      notes: data.notes || undefined,
      // New fields
      variantId: data.variant_id || undefined,
      partySize: data.party_size || undefined,
      guestsAdults: data.guests_adults || undefined,
      guestsChildren: data.guests_children || undefined,
      addons: data.addons?.map((a) => ({
        addonId: a.addon_id,
        quantity: a.quantity,
        optionId: a.option_id || undefined,
        optionPriceCentavos: a.option_price_centavos || undefined,
      })),
    });

    // 5. Log audit event
    await logAuditEvent(serviceClient, {
      action: 'public_booking_created',
      businessId: business.id,
      details: {
        bookingId: result.bookingId,
        confirmationCode: result.confirmationCode,
        customerId: result.customerId,
        isNewCustomer: result.isNewCustomer,
        pointsEarned: result.pointsEarned,
        totalPriceCentavos: result.totalPriceCentavos,
        addonsCount: data.addons?.length || 0,
        processingTimeMs: Date.now() - startTime,
        ipAddress,
        userAgent,
      },
    });

    // 6. Return success response
    return NextResponse.json({
      success: true,
      data: {
        bookingId: result.bookingId,
        confirmationCode: result.confirmationCode,
        customerId: result.customerId,
        cardToken: result.cardToken,
        pointsEarned: result.pointsEarned,
        isNewCustomer: result.isNewCustomer,
        totalPriceCentavos: result.totalPriceCentavos,
      },
    });
  } catch (error) {
    console.error('Create public booking error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
