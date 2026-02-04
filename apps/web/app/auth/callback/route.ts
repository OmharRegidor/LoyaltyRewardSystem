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
  const plan = requestUrl.searchParams.get('plan');
  const interval = requestUrl.searchParams.get('interval') || 'monthly';

  if (error) {
    console.error('Auth callback error:', error, error_description);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error_description || error)}`,
        requestUrl.origin,
      ),
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, {
                ...options,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 365,
              });
            } catch {
              // Ignore errors in edge runtime
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
    console.log('[Auth Callback] Verifying OTP with type:', type);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'email',
    });

    if (verifyError) {
      console.error('[Auth Callback] OTP verification error:', verifyError);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(verifyError.message)}`,
          requestUrl.origin,
        ),
      );
    }

    session = data.session;
    user = data.user;
    console.log(
      '[Auth Callback] OTP verified, user:',
      user?.id,
      'session:',
      !!session,
    );
  }

  // Handle OAuth code exchange
  if (code && !session) {
    console.log('[Auth Callback] Exchanging code for session');

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin,
        ),
      );
    }

    session = data.session;
    user = data.user;
    console.log(
      '[Auth Callback] Code exchanged, user:',
      user?.id,
      'session:',
      !!session,
    );
  }

  // If we have a session and user, set up their account
  if (session && user) {
    const userId = user.id;
    const userEmail = user.email || null;
    const userMetadata = user.user_metadata;

    const selectedPlan =
      plan || (userMetadata?.selected_plan as string | undefined);
    const billingInterval =
      interval ||
      (userMetadata?.billing_interval as string | undefined) ||
      'monthly';

    // Ensure business exists (handles trigger errors gracefully)
    const business = await ensureBusinessExists(
      userId,
      userEmail,
      userMetadata,
    );

    if (!business) {
      console.error(
        '[Auth Callback] Failed to create/find business, but continuing...',
      );
    }

    // Get redirect path
    const finalRedirectPath = await getRedirectPath(
      userId,
      selectedPlan,
      billingInterval,
    );

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL(finalRedirectPath, requestUrl.origin),
    );

    // Set session cookies
    if (session.access_token && session.refresh_token) {
      const projectRef =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1];

      if (projectRef) {
        response.cookies.set(
          `sb-${projectRef}-auth-token`,
          JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
            expires_in: session.expires_in,
            token_type: 'bearer',
            user: user,
          }),
          {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
            httpOnly: false,
          },
        );
      }
    }

    console.log('[Auth Callback] Redirecting to:', finalRedirectPath);
    return response;
  }

  // User verified but no session (different device)
  if (user && !session) {
    console.log('[Auth Callback] User verified but no session');
    return NextResponse.redirect(
      new URL('/login?message=email_verified', requestUrl.origin),
    );
  }

  console.log('[Auth Callback] No valid auth found');
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

// ============================================
// FIXED: Handle subscription trigger errors
// ============================================
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
    // Check if business already exists
    const { data: existingBusiness } = await serviceSupabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existingBusiness) {
      console.log(
        '[Auth Callback] Business already exists:',
        existingBusiness.id,
      );
      return existingBusiness;
    }

    const businessName =
      (userMetadata?.business_name as string) || 'My Business';
    const ownerEmail = userEmail || (userMetadata?.email as string) || '';

    console.log('[Auth Callback] Creating new business for user:', userId);

    const { data: newBusiness, error } = await serviceSupabase
      .from('businesses')
      .insert({
        owner_id: userId,
        name: businessName,
        owner_email: ownerEmail,
        is_free_forever: true,
        subscription_status: 'active',
        points_per_purchase: 1,
        pesos_per_point: 100,
        min_purchase_for_points: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Auth Callback] Error creating business:', error);

      // FIXED: If error is from subscription trigger duplicate, business was still created
      if (error.code === '23505' && error.message?.includes('subscriptions')) {
        console.log(
          '[Auth Callback] Subscription trigger error, fetching created business...',
        );

        const { data: createdBusiness } = await serviceSupabase
          .from('businesses')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle();

        if (createdBusiness) {
          console.log(
            '[Auth Callback] Found business after trigger error:',
            createdBusiness.id,
          );
          return createdBusiness;
        }
      }

      return null;
    }

    console.log('[Auth Callback] Business created:', newBusiness.id);
    return newBusiness;
  } catch (err) {
    console.error('[Auth Callback] Error in ensureBusinessExists:', err);
    return null;
  }
}

async function getRedirectPath(
  userId: string,
  selectedPlan?: string | null,
  billingInterval?: string,
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js');
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // Check if user is staff
    const { data: staffData } = await serviceSupabase
      .from('staff')
      .select('id, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (staffData) {
      return '/staff';
    }

    // Check if user is business owner
    const { data: businessData } = await serviceSupabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (businessData) {
      if (selectedPlan && selectedPlan !== 'free') {
        return `/dashboard/settings/billing?plan=${selectedPlan}&interval=${billingInterval || 'monthly'}`;
      }
      return '/dashboard?welcome=true';
    }
  } catch (err) {
    console.error('[Auth Callback] Error determining redirect:', err);
  }

  return '/dashboard';
}
