import { NextRequest, NextResponse } from 'next/server';
import {
  getBusinessBySlug,
  getPublicAvailability,
} from '@/lib/services/public-business.service';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const business = await getBusinessBySlug(slug);

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const availability = await getPublicAvailability(business.id);

    return NextResponse.json({
      success: true,
      data: {
        ...business,
        availability,
      },
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
