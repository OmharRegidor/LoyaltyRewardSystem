// apps/web/app/api/public/business/[slug]/addons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug, getPublicAddons } from '@/lib/services/public-business.service';

// ============================================
// GET: Fetch add-ons for a business
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get business by slug
    const business = await getBusinessBySlug(slug);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get add-ons
    const addons = await getPublicAddons(business.id);

    return NextResponse.json({
      success: true,
      data: addons,
    });
  } catch (error) {
    console.error('Get public addons error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
