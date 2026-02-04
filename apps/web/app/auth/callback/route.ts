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

  // Debug logging to trace auth callback flow
  console.log('[Auth Callback] Request params:', {
    hasCode: !!code,
    hasTokenHash: !!token_hash,
    type,
    error,
    plan,
  });

  if (error) {
    console.error('Auth callback error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin),
    );
  }

  const cookieStore = await cookies();

  // Store cookies to apply to final response
  const cookiesToApply: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

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
            cookiesToApply.push({ name, value, options: options || {} });
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
  let sessionEstablished = false;

  // Handle email verification with token_hash (older email verification format)
  if (token_hash && type) {
    console.log('[Auth Callback] Verifying OTP with token_hash, type:', type);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'email',
    });

    if (verifyError) {
      console.error('[Auth Callback] OTP verification error:', verifyError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(verifyError.message)}`, requestUrl.origin),
      );
    }

    if (data.user) {
      userId = data.user.id;
      userEmail = data.user.email || null;
      userMetadata = data.user.user_metadata;
      sessionEstablished = !!data.session;
      console.log('[Auth Callback] OTP verification success:', {
        userId,
        userEmail,
        sessionEstablished,
      });
    }
  }

  // Handle code exchange (PKCE flow - used by email verification and OAuth)
  if (code && !userId) {
    console.log('[Auth Callback] Exchanging code for session');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin),
      );
    }

    if (data.user) {
      userId = data.user.id;
      userEmail = data.user.email || null;
      userMetadata = data.user.user_metadata;
      sessionEstablished = !!data.session;
      console.log('[Auth Callback] Code exchange success:', {
        userId,
        userEmail,
        sessionEstablished,
      });
    }
  }

  // If we have a user, set up their account
  if (userId) {
    console.log('[Auth Callback] User authenticated, ensuring business exists:', { userId, userEmail });
    const selectedPlan = plan || (userMetadata?.selected_plan as string | undefined);
    const billingInterval = interval || (userMetadata?.billing_interval as string | undefined) || 'monthly';

    const business = await ensureBusinessExists(userId, userEmail, userMetadata);

    if (!business) {
      console.error('[Auth Callback] Failed to create business for user:', userId);
      return NextResponse.redirect(
        new URL('/login?error=setup_failed', requestUrl.origin),
      );
    }

    console.log('[Auth Callback] Business ready:', { businessId: business.id });

    const finalRedirectUrl = await getRedirectUrl(userId, requestUrl, selectedPlan, billingInterval);

    const finalResponse = NextResponse.redirect(finalRedirectUrl);

    cookiesToApply.forEach(({ name, value, options }) => {
      finalResponse.cookies.set(name, value, {
        ...options,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      });
    });

    return finalResponse;
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

async function ensureBusinessExists(
  userId: string,
  userEmail: string | null,
  userMetadata?: Record<string, unknown>,
) {
  const { createClient } = await import('@supabase/supabase-js');

  // Check if service role key is configured
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Auth Callback] SUPABASE_SERVICE_ROLE_KEY is not configured!');
    return null;
  }

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const { data: existingBusiness } = await serviceSupabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (existingBusiness) {
      console.log('[Auth Callback] Found existing business:', existingBusiness.id);
      return existingBusiness;
    }

    console.log('[Auth Callback] Creating new business for user:', userId);

    const businessName = (userMetadata?.business_name as string) || 'My Business';
    const ownerEmail = userEmail || (userMetadata?.email as string) || '';

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
      console.error('[Auth Callback] Error creating business:', {
        userId,
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return null;
    }

    console.log('[Auth Callback] Business created successfully:', newBusiness.id);
    return newBusiness;
  } catch (err) {
    console.error('Error in ensureBusinessExists:', err);
    return null;
  }
}

async function getRedirectUrl(
  userId: string,
  requestUrl: URL,
  selectedPlan?: string | null,
  billingInterval?: string,
): Promise<URL> {
  const { createClient } = await import('@supabase/supabase-js');
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const { data: staffData } = await serviceSupabase
      .from('staff')
      .select('id, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (staffData) {
      return new URL('/staff', requestUrl.origin);
    }

    const { data: businessData } = await serviceSupabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (businessData) {
      if (selectedPlan && selectedPlan !== 'free') {
        return new URL(
          `/dashboard/settings/billing?plan=${selectedPlan}&interval=${billingInterval || 'monthly'}`,
          requestUrl.origin,
        );
      }
      return new URL('/dashboard?welcome=true', requestUrl.origin);
    }
  } catch (err) {
    console.error('Error determining redirect:', err);
  }

  return new URL('/dashboard', requestUrl.origin);
}
