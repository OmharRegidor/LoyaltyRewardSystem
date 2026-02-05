// apps/web/app/api/public/business/[slug]/availability/range/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { checkDateRangeAvailability } from '@/lib/services/public-booking.service';

// ============================================
// GET: Check date range availability (multi-day)
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const serviceId = searchParams.get('service_id');

    // Validate required params
    if (!startDate || !endDate || !serviceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: start_date, end_date, service_id' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Get business by slug
    const business = await getBusinessBySlug(slug);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check date range availability
    const result = await checkDateRangeAvailability(
      business.id,
      startDate,
      endDate,
      serviceId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Check date range availability error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
