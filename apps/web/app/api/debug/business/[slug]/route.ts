// apps/web/app/api/debug/business/[slug]/route.ts
// DEBUG ONLY - Remove in production

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServiceClient();

    // Try to fetch the business
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, slug, owner_id, created_at')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    if (!business) {
      // List all businesses to help debug
      const { data: allBusinesses } = await supabase
        .from('businesses')
        .select('id, name, slug')
        .limit(10);

      return NextResponse.json(
        {
          error: 'Business not found',
          searchedSlug: slug,
          existingBusinesses: allBusinesses || [],
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ business });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
