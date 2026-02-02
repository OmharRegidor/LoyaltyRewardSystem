// apps/web/app/api/debug/seed-binukbok/route.ts
// DEBUG ONLY - Remove after use

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = createServiceClient();

    // Simply update the existing Jaza Cafe business slug to "binukbok"
    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update({ slug: 'binukbok' })
      .eq('slug', 'jaza-cafe')
      .select('id, name, slug, owner_id')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update business slug', details: updateError },
        { status: 500 }
      );
    }

    if (!updatedBusiness) {
      return NextResponse.json(
        { error: 'Business not found with slug jaza-cafe' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Business slug updated from jaza-cafe to binukbok',
      business: updatedBusiness,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
