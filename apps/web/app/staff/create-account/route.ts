// apps/web/app/api/staff/create-account/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '../../../../../packages/shared/types/database';

// Create Supabase Admin client with service role key
function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

interface CreateStaffAccountRequest {
  email: string;
  password: string;
  fullName: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreateStaffAccountRequest = await request.json();
    const { email, password, fullName } = body;

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    // Create user with Supabase Admin API (email auto-confirmed)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: password,
        email_confirm: true, // Auto-confirm email - no verification needed
        user_metadata: {
          full_name: fullName,
          role: 'staff',
        },
      });

    if (createError) {
      // Check if user already exists
      if (createError.message.includes('already been registered')) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This email is already registered. The cashier can use their existing password to login.',
            code: 'USER_EXISTS',
          },
          { status: 409 },
        );
      }

      console.error('Create user error:', createError);
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 400 },
      );
    }

    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      userId: userData.user.id,
      email: userData.user.email,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
