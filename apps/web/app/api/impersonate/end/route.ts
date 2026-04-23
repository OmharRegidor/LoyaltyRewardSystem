import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminServiceClient } from '@/lib/supabase-server';
import {
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_DISPLAY_COOKIE_NAME,
  IMPERSONATION_MODE_COOKIE_NAME,
  decodeImpersonationCookie,
} from '@/lib/impersonation';
import type { Database } from '../../../../../../packages/shared/types/database';

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

export async function POST(request: NextRequest) {
  const payload = await decodeImpersonationCookie(
    request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value,
  );

  // Build the response up front so the sign-out cookie clears and the
  // impersonation cookie deletes land together on one response.
  const response = NextResponse.json({ success: true });

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

  await supabase.auth.signOut();

  response.cookies.delete(IMPERSONATION_COOKIE_NAME);
  response.cookies.delete(IMPERSONATION_DISPLAY_COOKIE_NAME);
  response.cookies.delete(IMPERSONATION_MODE_COOKIE_NAME);

  if (payload) {
    const service = createAdminServiceClient();

    const { data: session } = await service
      .from('impersonation_sessions')
      .select('admin_email, target_email')
      .eq('id', payload.sessionId)
      .maybeSingle();

    await service
      .from('impersonation_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', payload.sessionId)
      .is('ended_at', null);

    await service.from('impersonation_logs').insert({
      session_id: payload.sessionId,
      admin_user_id: payload.adminUserId,
      admin_email: session?.admin_email ?? 'unknown',
      target_user_id: payload.targetUserId,
      target_email: session?.target_email ?? 'unknown',
      target_role: payload.targetRole,
      event: 'ended',
      ip_address: getClientIp(request),
      user_agent: request.headers.get('user-agent'),
    });
  }

  return response;
}
