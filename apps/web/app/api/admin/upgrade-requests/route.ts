import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const validStatuses = ['pending', 'approved', 'rejected'] as const;
  type UpgradeStatus = typeof validStatuses[number];
  const status: UpgradeStatus | null =
    statusParam && validStatuses.includes(statusParam as UpgradeStatus)
      ? (statusParam as UpgradeStatus)
      : null;
  const countOnly = searchParams.get('countOnly') === 'true';

  const service = createAdminServiceClient();

  if (countOnly) {
    let countQuery = service
      .from('upgrade_requests')
      .select('id', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error } = await countQuery;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  }

  let query = service
    .from('upgrade_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: requests, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch upgrade requests' }, { status: 500 });
  }

  if (!requests || requests.length === 0) {
    return NextResponse.json({ requests: [] });
  }

  // Enrich with business names
  const businessIds = [...new Set(requests.map((r) => r.business_id))];
  const { data: businesses } = await service
    .from('businesses')
    .select('id, name, owner_email')
    .in('id', businessIds);

  const bizMap = new Map<string, { name: string; owner_email: string | null }>();
  for (const b of businesses ?? []) {
    bizMap.set(b.id, { name: b.name, owner_email: b.owner_email });
  }

  const enriched = requests.map((r) => {
    const biz = bizMap.get(r.business_id);
    return {
      ...r,
      business_name: biz?.name ?? 'Unknown',
    };
  });

  return NextResponse.json({ requests: enriched });
}
