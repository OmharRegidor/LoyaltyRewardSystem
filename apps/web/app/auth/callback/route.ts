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
            cookiesToSet.push({ name, value, options });
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Ignore
            }
          });
        },
      },
    },
  );

  let session = null;
  let user = null;

  // Handle email verification
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

  // If we have session and user, set up account
  if (session && user) {
    console.log('[Auth Callback] Setting up account for:', user.id);

    // Ensure business and subscription exist
    await ensureBusinessAndSubscription(
      user.id,
      user.email || null,
      user.user_metadata,
    );

    // Get redirect path
    const redirectPath = await getRedirectPath(user.id);
    console.log('[Auth Callback] Redirect path:', redirectPath);

    // Create redirect response
    const response = NextResponse.redirect(
      new URL(redirectPath, requestUrl.origin),
    );

    // Set cookies
    console.log('[Auth Callback] Setting', cookiesToSet.length, 'cookies');
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, {
        ...options,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return response;
  }

  // No session
  console.log('[Auth Callback] No session, redirecting to login');
  if (user) {
    return NextResponse.redirect(
      new URL('/login?message=email_verified', requestUrl.origin),
    );
  }
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

// ============================================
// Create business AND subscription in one flow
// ============================================
async function ensureBusinessAndSubscription(
  userId: string,
  userEmail: string | null,
  userMetadata?: Record<string, unknown>,
) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // Step 1: Check if business already exists
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    let businessId: string;

    if (existingBusiness) {
      console.log('[Auth Callback] Business exists:', existingBusiness.id);
      businessId = existingBusiness.id;
    } else {
      // Step 2: Create business
      const businessName =
        (userMetadata?.business_name as string) || 'My Business';

      const { data: newBusiness, error: bizError } = await supabase
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

      if (bizError) {
        console.error('[Auth Callback] Business create error:', bizError);
        return null;
      }

      console.log('[Auth Callback] Business created:', newBusiness.id);
      businessId = newBusiness.id;
    }

    // Step 3: Ensure subscription exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('business_id', businessId)
      .maybeSingle();

    if (!existingSub) {
      // Get free plan
      const { data: freePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('name', 'free')
        .single();

      if (freePlan) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            business_id: businessId,
            plan_id: freePlan.id,
            status: 'active',
          });

        if (subError) {
          console.error('[Auth Callback] Subscription create error:', subError);
          // Not fatal - continue anyway
        } else {
          console.log(
            '[Auth Callback] Subscription created for business:',
            businessId,
          );
        }
      }
    } else {
      console.log('[Auth Callback] Subscription exists:', existingSub.id);
    }

    return { id: businessId };
  } catch (err) {
    console.error('[Auth Callback] ensureBusinessAndSubscription error:', err);
    return null;
  }
}

async function getRedirectPath(userId: string): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const { data: staff } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (staff) return '/staff';

    const { data: business } = await supabase
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
