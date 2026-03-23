// apps/web/app/auth/callback/route.ts

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import type { Database } from '../../../../../packages/shared/types/database';

function generateJoinCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('[Auth Callback] Started', {
    hasCode: !!code,
    hasTokenHash: !!token_hash,
    type,
    error,
  });

  if (error) {
    console.error('[Auth Callback] Error:', error, error_description);
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error_description || error)}`,
        requestUrl.origin,
      ),
    );
  }

  const cookieStore = await cookies();

  // Create response early so we can set cookies on it
  let redirectUrl = new URL('/login', requestUrl.origin);

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
              cookieStore.set(name, value, options);
            } catch {
              // Will set on response
            }
          });
        },
      },
    },
  );

  try {
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

    // If we have session and user
    if (session && user) {
      if (type === 'recovery') {
        // Skip business setup, redirect to reset page
        console.log('[Auth Callback] Recovery flow, redirecting to reset-password');
        redirectUrl = new URL('/reset-password', requestUrl.origin);
      } else {
        console.log('[Auth Callback] Setting up account...');

        // Create business and subscription
        await ensureBusinessAndSubscription(
          user.id,
          user.email || null,
          user.user_metadata,
        );

        // Get redirect path
        const redirectPath = await getRedirectPath(user.id);
        redirectUrl = new URL(redirectPath, requestUrl.origin);

        console.log('[Auth Callback] Success! Redirecting to:', redirectPath);
      }
    } else if (user && !session) {
      console.log('[Auth Callback] User verified but no session');
      redirectUrl = new URL('/login?message=email_verified', requestUrl.origin);
    } else {
      console.log('[Auth Callback] No valid auth');
      redirectUrl = new URL('/login', requestUrl.origin);
    }
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err);
    redirectUrl = new URL('/login?error=unexpected', requestUrl.origin);
  }

  // Create response and let Supabase SSR handle cookies
  const response = NextResponse.redirect(redirectUrl);

  // Copy all cookies from cookieStore to response
  const allCookies = cookieStore.getAll();
  console.log('[Auth Callback] Setting', allCookies.length, 'cookies');

  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, cookie.value, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: cookie.name.includes('refresh'),
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }
  }

  return response;
}

async function ensureBusinessAndSubscription(
  userId: string,
  userEmail: string | null,
  userMetadata?: Record<string, unknown>,
) {
  const { createServiceClient } = await import('@/lib/supabase-server');
  const supabase = createServiceClient();

  try {
    // Check if business exists
    let { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    // Create business if not exists
    if (!business) {
      const businessName =
        (userMetadata?.business_name as string) || 'My Business';

      // Generate a unique slug from the business name
      const baseSlug = (businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        || 'my-business').slice(0, 40);

      // Try clean slug first, only append random suffix if taken
      const { data: existingSlug } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', baseSlug)
        .maybeSingle();

      const slug = existingSlug
        ? `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`
        : baseSlug;

      const { data: newBiz, error: bizError } = await supabase
        .from('businesses')
        .insert({
          owner_id: userId,
          name: businessName,
          slug,
          owner_email: userEmail || '',
          subscription_status: 'active',
          points_per_purchase: 1,
          pesos_per_point: 100,
          min_purchase_for_points: 0,
          join_code: generateJoinCode(),
          business_type: (userMetadata?.business_type as string) || null,
          phone: (userMetadata?.phone as string) || null,
        })
        .select('id')
        .single();

      if (bizError) {
        console.error('[Auth Callback] Business error:', bizError.message);
        // Try to fetch it anyway - might have been created
        const { data: existingBiz } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', userId)
          .maybeSingle();
        business = existingBiz;
      } else {
        business = newBiz;
        console.log('[Auth Callback] Business created:', business?.id);
      }
    } else {
      console.log('[Auth Callback] Business exists:', business.id);
    }

    if (!business) {
      console.error('[Auth Callback] No business found or created');
      return null;
    }

    // Check subscription and fetch free plan in parallel
    const [{ data: existingSub }, { data: freePlan }] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id')
        .eq('business_id', business.id)
        .maybeSingle(),
      supabase
        .from('plans')
        .select('id')
        .eq('name', 'free')
        .single(),
    ]);

    if (!existingSub && freePlan) {
      const { error: subError } = await supabase.from('subscriptions').upsert(
        {
          business_id: business.id,
          plan_id: freePlan.id,
          status: 'active',
        },
        {
          onConflict: 'business_id',
        },
      );

      if (subError) {
        console.error(
          '[Auth Callback] Subscription error:',
          subError.message,
        );
      } else {
        console.log('[Auth Callback] Subscription created');
      }
    } else if (existingSub) {
      console.log('[Auth Callback] Subscription exists');
    }

    // Auto-activate trial if user signed up from Premium CTA
    const signupPlan = userMetadata?.signup_plan as string | undefined;
    if (signupPlan === 'trial' && business) {
      const { data: enterprisePlan } = await supabase
        .from('plans')
        .select('id')
        .eq('name', 'enterprise')
        .single();

      if (enterprisePlan) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const { error: trialError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: enterprisePlan.id,
            status: 'trialing',
            trial_ends_at: trialEndsAt.toISOString(),
            module_pos_override: true,
            billing_interval: 'annual',
          })
          .eq('business_id', business.id);

        if (trialError) {
          console.error('[Auth Callback] Trial activation error:', trialError.message);
        } else {
          console.log('[Auth Callback] Trial auto-activated, ends:', trialEndsAt.toISOString());
        }
      }
    }

    return business;
  } catch (err) {
    console.error('[Auth Callback] Setup error:', err);
    return null;
  }
}

async function getRedirectPath(userId: string): Promise<string> {
  const { createServiceClient } = await import('@/lib/supabase-server');
  const supabase = createServiceClient();

  try {
    // Check business owner and staff in parallel instead of querying roles table
    const [{ data: business }, { data: staff }] = await Promise.all([
      supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle(),
      supabase
        .from('staff')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    if (business) return '/dashboard?welcome=true';
    if (staff) return '/staff';
    return '/';
  } catch (err) {
    console.error('[Auth Callback] Redirect error:', err);
  }

  return '/dashboard';
}
