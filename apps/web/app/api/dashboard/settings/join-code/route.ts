// apps/web/app/api/dashboard/settings/join-code/route.ts

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server';
import crypto from 'crypto';

// ============================================
// HELPER: Get Business ID for Owner
// ============================================

async function getOwnerBusinessId(userId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  return business?.id || null;
}

// ============================================
// GET: Return current join_code
// ============================================

export async function GET() {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = await getOwnerBusinessId(user.id);
    if (!businessId) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const supabase = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('businesses')
      .select('join_code')
      .eq('id', businessId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to fetch join code' }, { status: 500 });
    }

    return NextResponse.json({ joinCode: data.join_code });
  } catch (error) {
    console.error('Get join code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST: Regenerate join_code
// ============================================

export async function POST() {
  try {
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = await getOwnerBusinessId(user.id);
    if (!businessId) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const newCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const supabase = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('businesses')
      .update({ join_code: newCode })
      .eq('id', businessId);

    if (error) {
      console.error('Regenerate join code error:', error);
      return NextResponse.json({ error: 'Failed to regenerate join code' }, { status: 500 });
    }

    return NextResponse.json({ joinCode: newCode });
  } catch (error) {
    console.error('Regenerate join code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
