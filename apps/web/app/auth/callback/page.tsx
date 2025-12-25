// apps/web/app/auth/callback/route.ts

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user is staff or owner
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, role')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffData) {
        // User is staff - redirect to scanner
        return NextResponse.redirect(new URL('/staff', requestUrl.origin));
      }

      // Check if user is business owner
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', data.user.id)
        .maybeSingle();

      if (businessData) {
        // User is owner - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      }

      // Default redirect
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Something went wrong, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
