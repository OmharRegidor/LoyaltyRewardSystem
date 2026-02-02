// apps/web/app/api/debug/subscriptions/route.ts
// DEBUG ONLY - Check subscriptions table

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('id, business_id, plan_id, status, is_free_forever')
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also check for orphaned subscriptions (subscriptions without matching business)
    const { data: orphaned } = await supabase
      .from('subscriptions')
      .select('id, business_id')
      .not('business_id', 'in', `(SELECT id FROM businesses)`);

    return NextResponse.json({
      subscriptions,
      orphanedCount: orphaned?.length || 0,
      orphaned,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
