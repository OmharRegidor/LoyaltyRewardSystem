import { NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import type { EnterpriseAccount } from '@/lib/admin';

export async function GET() {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createAdminServiceClient();

  const { data, error } = await service.rpc('admin_list_enterprise_accounts');

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch enterprise accounts' },
      { status: 500 },
    );
  }

  const accounts: EnterpriseAccount[] = (data ?? []).map((row) => ({
    id: row.subscription_id,
    businessId: row.business_id,
    businessName: row.business_name ?? 'Unknown',
    ownerEmail: row.owner_email ?? null,
    upgradedAt: row.upgraded_at ?? '',
    planName: row.plan_display_name ?? 'Enterprise',
    hasPos: row.has_pos === true,
  }));

  return NextResponse.json(accounts);
}
