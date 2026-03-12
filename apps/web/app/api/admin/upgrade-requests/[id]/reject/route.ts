import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RejectBody {
  reason?: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as RejectBody;

  const service = createAdminServiceClient();

  // Validate request exists and is pending
  const { data: upgradeReq } = await service
    .from('upgrade_requests')
    .select('id, status')
    .eq('id', id)
    .single();

  if (!upgradeReq) {
    return NextResponse.json({ error: 'Upgrade request not found' }, { status: 404 });
  }

  if (upgradeReq.status !== 'pending') {
    return NextResponse.json(
      { error: 'Request is not pending' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const { error: updateError } = await service
    .from('upgrade_requests')
    .update({
      status: 'rejected',
      reviewed_by_email: user.email,
      reviewed_at: now,
      rejection_reason: body.reason?.trim() || null,
      updated_at: now,
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to reject request' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
