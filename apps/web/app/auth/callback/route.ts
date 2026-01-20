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

  // Default redirect URL
  let redirectPath = '/dashboard';

  // If plan signup, redirect to billing page with plan info
  if (plan) {
    redirectPath = `/dashboard/settings/billing?plan=${plan}&interval=${interval}`;
  }

  // Create response with redirect
  const response = NextResponse.redirect(
    new URL(redirectPath, requestUrl.origin),
  );

  // Store cookies to apply to final response
  const cookiesToApply: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

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
            // Store for final response
            cookiesToApply.push({ name, value, options: options || {} });
            // Also set on cookieStore so subsequent calls see the session
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Ignore errors in edge runtime
            }
          });
        },
      },
    },
  );

  let userId: string | null = null;
  let userEmail: string | null = null;
  let userMetadata: Record<string, unknown> | undefined;

  // Handle email verification (signup, recovery, invite, email_change)
  if (token_hash && type) {
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

    if (data.user) {
      userId = data.user.id;
      userEmail = data.user.email || null;
      userMetadata = data.user.user_metadata;
    }
  }

  // Handle OAuth code exchange (Google, etc.)
  if (code && !userId) {
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

    if (data.user) {
      userId = data.user.id;
      userEmail = data.user.email || null;
      userMetadata = data.user.user_metadata;
    }
  }

  // If we have a user, set up their account
  if (userId) {
    // Get plan info from metadata if not in URL
    const selectedPlan =
      plan || (userMetadata?.selected_plan as string | undefined);
    const billingInterval =
      interval ||
      (userMetadata?.billing_interval as string | undefined) ||
      'monthly';

    // Create business for new user if not exists (using service role for bypassing RLS)
    await ensureBusinessExists(userId, userEmail, userMetadata);

    // Determine final redirect
    const finalRedirectUrl = await getRedirectUrl(
      supabase,
      userId,
      requestUrl,
      selectedPlan,
      billingInterval,
    );

    // Create final response with cookies
    const finalResponse = NextResponse.redirect(finalRedirectUrl);

    // Apply all auth cookies to the final redirect response
    cookiesToApply.forEach(({ name, value, options }) => {
      finalResponse.cookies.set(name, value, {
        ...options,
        path: '/',
        // DO NOT override httpOnly - let Supabase set it correctly
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      });
    });

    return finalResponse;
  }

  // No valid auth, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

// Helper: Ensure business exists for user (using service role client)
async function ensureBusinessExists(
  userId: string,
  userEmail: string | null,
  userMetadata?: Record<string, unknown>,
) {
  // Use service role to bypass RLS
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
        // Required NOT NULL fields
        is_free_forever: false,
        subscription_status: 'preview', // Start in preview mode
        // Default loyalty settings
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

// Helper: Determine redirect URL based on user type and plan
async function getRedirectUrl(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
  requestUrl: URL,
  selectedPlan?: string | null,
  billingInterval?: string,
): Promise<URL> {
  try {
    // Check if user is staff (use service role to avoid RLS issues during callback)
    const { createClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: staffData } = await serviceSupabase
      .from('staff')
      .select('id, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (staffData) {
      return new URL('/staff', requestUrl.origin);
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
        return new URL(
          `/dashboard/settings/billing?plan=${selectedPlan}&interval=${
            billingInterval || 'monthly'
          }`,
          requestUrl.origin,
        );
      }

      // Otherwise, redirect to dashboard (preview mode)
      return new URL('/dashboard', requestUrl.origin);
    }
  } catch (err) {
    console.error('Error determining redirect:', err);
  }

  // Default redirect to dashboard
  return new URL('/dashboard', requestUrl.origin);
}
