import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import { generateOpaqueToken, hashOpaqueToken } from '@/lib/impersonation';

type ImpersonationModeInput = 'read_only' | 'edit';

interface Body {
  targetUserId: string;
  mode: ImpersonationModeInput;
  reason?: string;
}

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

export async function POST(request: NextRequest) {
  const admin = await getApiUser();
  if (!admin || !isAdmin(admin.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.targetUserId) {
    return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
  }
  if (body.mode !== 'read_only' && body.mode !== 'edit') {
    return NextResponse.json({ error: 'invalid_mode' }, { status: 400 });
  }
  const reasonTrimmed = (body.reason ?? '').trim();
  if (body.mode === 'edit' && reasonTrimmed.length < MIN_REASON_LENGTH) {
    return NextResponse.json({ error: 'reason_required' }, { status: 400 });
  }
  const reasonToStore =
    body.mode === 'edit' ? reasonTrimmed.slice(0, MAX_REASON_LENGTH) : null;

  const service = createAdminServiceClient();

  const { data: profile, error: profileError } = await service
    .from('users')
    .select('id, email, roles(name)')
    .eq('id', body.targetUserId)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
  }

  const role =
    (profile.roles as unknown as { name: string } | null)?.name ?? null;

  if (role !== 'business_owner' && role !== 'staff') {
    return NextResponse.json(
      { error: 'Only business owners and staff can be impersonated' },
      { status: 400 },
    );
  }

  const targetEmail = profile.email;
  if (!targetEmail) {
    return NextResponse.json({ error: 'Target user has no email' }, { status: 400 });
  }

  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: targetEmail,
  });

  if (linkError || !linkData?.properties?.email_otp) {
    return NextResponse.json(
      { error: `Failed to generate magic link: ${linkError?.message ?? 'unknown'}` },
      { status: 500 },
    );
  }

  const opaqueToken = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(opaqueToken);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { data: session, error: insertError } = await service
    .from('impersonation_sessions')
    .insert({
      admin_user_id: admin.id,
      admin_email: admin.email,
      target_user_id: profile.id,
      target_email: targetEmail,
      target_role: role,
      opaque_token_hash: tokenHash,
      magic_otp: linkData.properties.email_otp,
      expires_at: expiresAt,
      ip_address: getClientIp(request),
      user_agent: request.headers.get('user-agent'),
      mode: body.mode,
      reason: reasonToStore,
    })
    .select('id')
    .single();

  if (insertError || !session) {
    return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 });
  }

  await service.from('impersonation_logs').insert({
    session_id: session.id,
    admin_user_id: admin.id,
    admin_email: admin.email,
    target_user_id: profile.id,
    target_email: targetEmail,
    target_role: role,
    event: 'initiated',
    ip_address: getClientIp(request),
    user_agent: request.headers.get('user-agent'),
  });

  // The activation URL must land on the main app origin (not the admin
  // subdomain). Session cookies set on admin.* don't apply to the target
  // user's real workspace, and middleware would rewrite `/auth/impersonate`
  // into `/admin/auth/impersonate` on the admin subdomain.
  const url = request.nextUrl.clone();
  if (url.hostname.startsWith('admin.')) {
    url.hostname = url.hostname.slice('admin.'.length);
  }
  const activationUrl = `${url.protocol}//${url.host}/auth/impersonate?k=${opaqueToken}`;

  return NextResponse.json({
    activationUrl,
    targetEmail,
    targetRole: role,
    expiresAt,
  });
}
