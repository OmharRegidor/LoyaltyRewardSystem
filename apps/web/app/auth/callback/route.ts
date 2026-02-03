// apps/web/app/auth/callback/route.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '../../../../../packages/shared/types/database';

// Cookie storage that collects cookies to be set on the response
interface PendingCookie {
  name: string;
  value: string;
  options?: {
    domain?: string;
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
  };
}

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

  // Collect cookies that need to be set on the response
  const pendingCookies: PendingCookie[] = [];

  // Create supabase client that collects cookies instead of setting them directly
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Collect cookies to set on response later
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({
              name,
              value,
              options: {
                ...options,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 365, // 1 year
              },
            });
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

    // Explicitly set the session to trigger setAll callback
    // verifyOtp doesn't automatically trigger cookie storage updates
    if (session) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
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

    // Explicitly set the session to trigger setAll callback
    // exchangeCodeForSession doesn't automatically trigger cookie storage updates
    if (session) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
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

    // Apply all pending cookies from Supabase auth operations to the response
    // This is critical: cookies collected during verifyOtp/exchangeCodeForSession
    // must be set on the response object, not just the cookieStore
    for (const cookie of pendingCookies) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    console.log(
      'Redirecting to:',
      finalRedirectPath,
      'with',
      pendingCookies.length,
      'auth cookies',
    );
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

    // Create new business with all required fields (Free plan by default)
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

      // Otherwise, redirect to dashboard with welcome flag for new signups
      return '/dashboard?welcome=true';
    }
  } catch (err) {
    console.error('Error determining redirect:', err);
  }

  // Default redirect to dashboard
  return '/dashboard';
}
