// apps/web/app/api/public/booking/[code]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getBookingByCode,
  generateCalendarFile,
} from '@/lib/services/public-booking.service';

// ============================================
// GET: Get booking by confirmation code
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (!code) {
      return NextResponse.json(
        { error: 'Confirmation code is required' },
        { status: 400 }
      );
    }

    // Get booking details
    const booking = await getBookingByCode(code);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // If format=ics, return calendar file
    if (format === 'ics') {
      const icsContent = generateCalendarFile(booking);

      return new NextResponse(icsContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${booking.confirmationCode}.ics"`,
        },
      });
    }

    // Return booking details
    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Get booking by code error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
