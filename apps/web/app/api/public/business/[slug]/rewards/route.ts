import { NextRequest, NextResponse } from 'next/server';
import {
  getBusinessBySlug,
  getPublicRewards,
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

    const rewards = await getPublicRewards(business.id);

    return NextResponse.json({
      success: true,
      data: rewards,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
