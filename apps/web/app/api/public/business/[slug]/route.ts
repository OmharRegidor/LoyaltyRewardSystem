import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/services/public-business.service';
import { cacheGet, CacheKeys, CacheTTL } from '@/lib/cache';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const business = await cacheGet(
      CacheKeys.business(slug),
      () => getBusinessBySlug(slug),
      { ttlSeconds: CacheTTL.business },
    );

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
