import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminServiceClient } from '@/lib/supabase-server';
import {
  encodeImpersonationCookie,
  hashOpaqueToken,
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
} from '@/lib/impersonation';
import { getRoleHomePath, type AppRole } from '@/lib/rbac';
import type { Database } from '../../../../../packages/shared/types/database';

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

function errorRedirect(request: NextRequest, reason: string): NextResponse {
  const url = new URL('/access-denied', request.url);
  url.searchParams.set('reason', reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('k');
  if (!token) return errorRedirect(request, 'missing_token');

  const service = createAdminServiceClient();
  const tokenHash = hashOpaqueToken(token);

  const { data: session } = await service
    .from('impersonation_sessions')
    .select('*')
    .eq('opaque_token_hash', tokenHash)
    .maybeSingle();

  if (!session) return errorRedirect(request, 'invalid_token');
  if (session.activated_at) return errorRedirect(request, 'already_used');
  if (session.ended_at) return errorRedirect(request, 'session_ended');
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await service.from('impersonation_logs').insert({
      session_id: session.id,
      admin_user_id: session.admin_user_id,
      admin_email: session.admin_email,
      target_user_id: session.target_user_id,
      target_email: session.target_email,
      target_role: session.target_role,
      event: 'expired',
      ip_address: getClientIp(request),
      user_agent: request.headers.get('user-agent'),
    });
    return errorRedirect(request, 'expired');
  }

  // Build the redirect response up front so we can attach every cookie to it.
  const home = getRoleHomePath(session.target_role as AppRole);
  const response = NextResponse.redirect(new URL(home, request.url));

  // Supabase SSR client that writes session cookies directly onto the response
  // we're about to return, instead of going through next/headers cookies().
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: session.target_email,
    token: session.magic_otp,
    type: 'magiclink',
  });

  if (verifyError) {
    return errorRedirect(request, 'verify_failed');
  }

  // Attach the impersonation cookies to the same response so they're guaranteed
  // to be set atomically with the Supabase session cookies.
  const secure = process.env.NODE_ENV === 'production';
  const encoded = await encodeImpersonationCookie({
    sessionId: session.id,
    adminUserId: session.admin_user_id,
    targetUserId: session.target_user_id,
    targetRole: session.target_role as 'business_owner' | 'staff',
    mode: 'read_only',
  });
  response.cookies.set(IMPERSONATION_COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  });
  response.cookies.set(IMPERSONATION_DISPLAY_COOKIE_NAME, session.target_email, {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
  });

  await service
    .from('impersonation_sessions')
    .update({ activated_at: new Date().toISOString() })
    .eq('id', session.id);

  await service.from('impersonation_logs').insert({
    session_id: session.id,
    admin_user_id: session.admin_user_id,
    admin_email: session.admin_email,
    target_user_id: session.target_user_id,
    target_email: session.target_email,
    target_role: session.target_role,
    event: 'activated',
    ip_address: getClientIp(request),
    user_agent: request.headers.get('user-agent'),
  });

  return response;
}
