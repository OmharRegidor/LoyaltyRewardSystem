// apps/web/app/api/customer/[userId]/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

// ============================================
// GET: Get customer profile by user ID
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 1. Authenticate the caller
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 2. Authorization: caller must be the user themselves, or a business owner/staff
    //    whose business the customer belongs to
    if (user.id !== userId) {
      // Check if caller is a business owner or staff with access to this customer
      const { data: customer } = await supabase
        .from('customers')
        .select('created_by_business_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (customer?.created_by_business_id) {
        // Check if caller owns the business
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('id', customer.created_by_business_id)
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!business) {
          // Check if caller is active staff at the business
          const { data: staff } = await supabase
            .from('staff')
            .select('id')
            .eq('business_id', customer.created_by_business_id)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (!staff) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }
      } else {
        // Customer not linked to any business, only the user themselves can access
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 3. Fetch profile data
    // First try auth.users metadata
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);

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

    // Fallback to customers table
    const { data: customerData } = await supabase
      .from('customers')
      .select('id, full_name, email, phone')
      .eq('user_id', userId)
      .maybeSingle();

    if (customerData) {
      return NextResponse.json({
        id: customerData.id,
        name: customerData.full_name,
        email: customerData.email,
        phone: customerData.phone,
      });
    }

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