// apps/web/app/api/public/business/[slug]/availability/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { getAvailableSlots } from '@/lib/services/public-booking.service';

// ============================================
// GET: Available time slots for a date
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');

    // Validate required params
    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: date, service_id' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get business by slug
    const business = await getBusinessBySlug(slug);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get available slots
    const result = await getAvailableSlots(business.id, date, serviceId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
