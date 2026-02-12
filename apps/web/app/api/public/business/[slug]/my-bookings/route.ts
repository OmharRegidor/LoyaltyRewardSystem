// apps/web/app/api/public/business/[slug]/my-bookings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { checkModuleAccess } from '@/lib/feature-gate';
import { getBookingsByPhone } from '@/lib/services/public-booking.service';

// ============================================
// VALIDATION SCHEMA
// ============================================

const QuerySchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .regex(/^[0-9]+$/, 'Phone number must contain only digits'),
});

// ============================================
// GET: Fetch bookings by phone number
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get phone from query params
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone') || '';

    // Validate phone
    const validation = QuerySchema.safeParse({ phone });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid phone number',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Get business by slug
    const business = await getBusinessBySlug(slug);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check booking module access
    const { allowed: hasBooking } = await checkModuleAccess(business.id, 'booking');
    if (!hasBooking) {
      return NextResponse.json(
        { error: 'Booking is not available for this business.' },
        { status: 403 }
      );
    }

    // Get bookings
    const bookings = await getBookingsByPhone(business.id, validation.data.phone);

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Get bookings by phone error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
