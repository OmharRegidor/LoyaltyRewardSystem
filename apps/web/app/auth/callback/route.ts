// apps/web/app/auth/callback/route.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '../../../../../packages/shared/types/database';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('[Auth Callback] Started', {
    code: !!code,
    token_hash: !!token_hash,
    type,
    error,
  });

  if (error) {
    console.error(
      '[Auth Callback] Error from Supabase:',
      error,
      error_description,
    );
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error_description || error)}`,
        requestUrl.origin,
      ),
    );
  }

  const cookieStore = await cookies();

  // Track cookies that need to be set on the response
  const cookiesToSet: Array<{ name: string; value: string; options: any }> = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            // Store cookies to set on response later
            cookiesToSet.push({ name, value, options });
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Ignore - will set on response
            }
          });
        },
      },
    },
  );

  let session = null;
  let user = null;

  // Handle email verification with token_hash
  if (token_hash && type) {
    console.log('[Auth Callback] Verifying OTP...');

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'email',
    });

    if (verifyError) {
      console.error('[Auth Callback] OTP error:', verifyError.message);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(verifyError.message)}`,
          requestUrl.origin,
        ),
      );
    }

    session = data.session;
    user = data.user;
    console.log('[Auth Callback] OTP verified:', {
      userId: user?.id,
      hasSession: !!session,
    });
  }

  // Handle OAuth code exchange
  if (code && !session) {
    console.log('[Auth Callback] Exchanging code...');

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Exchange error:', exchangeError.message);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin,
        ),
      );
    }

    session = data.session;
    user = data.user;
    console.log('[Auth Callback] Code exchanged:', {
      userId: user?.id,
      hasSession: !!session,
    });
  }

  // If we have session and user, set up account and redirect
  if (session && user) {
    console.log('[Auth Callback] Setting up account for:', user.id);

    // Ensure business exists
    await ensureBusinessExists(user.id, user.email || null, user.user_metadata);

    // Determine redirect path
    const redirectPath = await getRedirectPath(user.id);
    console.log('[Auth Callback] Redirect path:', redirectPath);

    // Create redirect response
    const response = NextResponse.redirect(
      new URL(redirectPath, requestUrl.origin),
    );

    // CRITICAL: Set all the cookies that Supabase created
    console.log('[Auth Callback] Setting', cookiesToSet.length, 'cookies');

    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, {
        ...options,
        // Ensure cookies work in production
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return response;
  }

  // No session - redirect to login
  console.log('[Auth Callback] No session, redirecting to login');

  if (user) {
    return NextResponse.redirect(
      new URL('/login?message=email_verified', requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

async function ensureBusinessExists(
  userId: string,
  userEmail: string | null,
  userMetadata?: Record<string, unknown>,
) {
  const { createClient } = await import('@supabase/supabase-js');
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // Check if exists
    const { data: existing } = await serviceSupabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existing) {
      console.log('[Auth Callback] Business exists:', existing.id);
      return existing;
    }

    // Create new
    const businessName =
      (userMetadata?.business_name as string) || 'My Business';

    const { data: newBiz, error } = await serviceSupabase
      .from('businesses')
      .insert({
        owner_id: userId,
        name: businessName,
        owner_email: userEmail || '',
        is_free_forever: true,
        subscription_status: 'active',
        points_per_purchase: 1,
        pesos_per_point: 100,
        min_purchase_for_points: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Auth Callback] Create business error:', error);

      // If subscription trigger failed, business might still exist
      if (error.code === '23505') {
        const { data: created } = await serviceSupabase
          .from('businesses')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle();

        if (created) {
          console.log(
            '[Auth Callback] Found business after error:',
            created.id,
          );
          return created;
        }
      }
      return null;
    }

    console.log('[Auth Callback] Created business:', newBiz.id);
    return newBiz;
  } catch (err) {
    console.error('[Auth Callback] ensureBusinessExists error:', err);
    return null;
  }
}

async function getRedirectPath(userId: string): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js');
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // Check staff first
    const { data: staff } = await serviceSupabase
      .from('staff')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (staff) return '/staff';

    // Check business owner
    const { data: business } = await serviceSupabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (business) return '/dashboard?welcome=true';
  } catch (err) {
    console.error('[Auth Callback] getRedirectPath error:', err);
  }

  return '/dashboard';
}
