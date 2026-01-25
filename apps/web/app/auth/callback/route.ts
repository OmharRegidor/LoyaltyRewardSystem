// apps/web/app/auth/callback/route.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '../../../../../packages/shared/types/database';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  // Get all possible auth parameters
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Plan parameters (for plan-based signup flow)
  const plan = requestUrl.searchParams.get('plan');
  const interval = requestUrl.searchParams.get('interval') || 'monthly';

  // Handle error from Supabase
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

  // Create supabase client
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
                maxAge: 60 * 60 * 24 * 365, // 1 year
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

  // Handle email verification (signup, recovery, invite, email_change)
  if (token_hash && type) {
    console.log('Verifying OTP with type:', type);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'email',
    });

    if (verifyError) {
      console.error('OTP verification error:', verifyError);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(verifyError.message)}`,
          requestUrl.origin,
        ),
      );
    }

    session = data.session;
    user = data.user;
    console.log('OTP verified, user:', user?.id, 'session:', !!session);
  }

  // Handle OAuth code exchange (Google, etc.)
  if (code && !session) {
    console.log('Exchanging code for session');

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin,
        ),
      );
    }

    session = data.session;
    user = data.user;
    console.log('Code exchanged, user:', user?.id, 'session:', !!session);
  }

  // If we have a session and user, set up their account and redirect
  if (session && user) {
    const userId = user.id;
    const userEmail = user.email || null;
    const userMetadata = user.user_metadata;

    // Get plan info from metadata if not in URL
    const selectedPlan =
      plan || (userMetadata?.selected_plan as string | undefined);
    const billingInterval =
      interval ||
      (userMetadata?.billing_interval as string | undefined) ||
      'monthly';

    // Create business for new user if not exists
    await ensureBusinessExists(userId, userEmail, userMetadata);

    // Determine final redirect URL
    const finalRedirectPath = await getRedirectPath(
      userId,
      selectedPlan,
      billingInterval,
    );

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL(finalRedirectPath, requestUrl.origin),
    );

    // Manually set the session cookies on the response
    // This ensures they're properly set even across devices
    if (session.access_token && session.refresh_token) {
      const cookieOptions = {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
      };

      // Set auth cookies
      response.cookies.set(
        'sb-access-token',
        session.access_token,
        cookieOptions,
      );
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 365, // 1 year for refresh token
      });
      // Add this right after setting the other cookies
      response.cookies.set('auth_timestamp', Date.now().toString(), {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10, // Only needed for 10 seconds
        httpOnly: false,
      });

      // Also set the Supabase auth cookie format
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
            httpOnly: false, // This one needs to be accessible by JS
          },
        );
      }
    }

    console.log('Redirecting to:', finalRedirectPath);
    return response;
  }

  // No valid session - check if we at least have a user without session
  // This can happen with email verification on different device
  if (user && !session) {
    console.log(
      'User verified but no session - redirecting to login with success message',
    );
    return NextResponse.redirect(
      new URL('/login?message=email_verified', requestUrl.origin),
    );
  }

  // No valid auth, redirect to login
  console.log('No valid auth found, redirecting to login');
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

// Helper: Ensure business exists for user (using service role client)
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
      return existingBusiness;
    }

    // Get business name from metadata
    const businessName =
      (userMetadata?.business_name as string) || 'My Business';
    const ownerEmail = userEmail || (userMetadata?.email as string) || '';

    // Create new business with all required fields
    const { data: newBusiness, error } = await serviceSupabase
      .from('businesses')
      .insert({
        owner_id: userId,
        name: businessName,
        owner_email: ownerEmail,
        is_free_forever: false,
        subscription_status: 'preview',
        points_per_purchase: 1,
        pesos_per_point: 100,
        min_purchase_for_points: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating business:', error);
      return null;
    }

    return newBusiness;
  } catch (err) {
    console.error('Error in ensureBusinessExists:', err);
    return null;
  }
}

// Helper: Determine redirect path based on user type and plan
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
      // If plan was selected, redirect to billing to complete payment
      if (selectedPlan && selectedPlan !== 'free') {
        return `/dashboard/settings/billing?plan=${selectedPlan}&interval=${billingInterval || 'monthly'}`;
      }

      // Otherwise, redirect to dashboard (preview mode)
      return '/dashboard';
    }
  } catch (err) {
    console.error('Error determining redirect:', err);
  }

  // Default redirect to dashboard
  return '/dashboard';
}
