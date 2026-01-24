// apps/web/app/api/customer/[userId]/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE SERVICE CLIENT (lazy initialization)
// ============================================

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================
// GET: Get customer profile by user ID
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // First try to get user metadata from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authUser?.user) {
      const metadata = authUser.user.user_metadata || {};
      return NextResponse.json({
        id: userId,
        name: metadata.full_name || metadata.name || null,
        email: authUser.user.email,
        phone: metadata.phone || null,
        avatar_url: metadata.avatar_url || null,
      });
    }

    // If not found in auth, try customers table
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, full_name, email, phone')
      .eq('user_id', userId)
      .maybeSingle();

    if (customer) {
      return NextResponse.json({
        id: customer.id,
        name: customer.full_name,
        email: customer.email,
        phone: customer.phone,
      });
    }

    // Not found
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Get customer profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}