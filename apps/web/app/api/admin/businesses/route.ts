// apps/web/app/api/admin/businesses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import { sanitizeIlikeSearch } from '@/lib/security';
import type {
  AdminBusinessListResponse,
  AdminBusinessStats,
} from '@/lib/admin';

const PAGE_SIZE = 20;
const SORT_WHITELIST = [
  'transactions_30d',
  'customer_count',
  'created_at',
  'name',
] as const;

type SortColumn = (typeof SORT_WHITELIST)[number];

export async function GET(request: NextRequest) {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createAdminServiceClient();
  const params = request.nextUrl.searchParams;

  // Parse query params
  const search = params.get('search')?.trim() || '';
  const plan = params.get('plan') || '';
  const type = params.get('type') || '';
  const status = params.get('status') || '';
  const sortParam = params.get('sort') || 'created_at';
  const order = params.get('order') === 'asc' ? true : false; // ascending?
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));

  const sort: SortColumn = SORT_WHITELIST.includes(sortParam as SortColumn)
    ? (sortParam as SortColumn)
    : 'created_at';

  // Build paginated query
  let query = service
    .from('admin_business_stats')
    .select('*', { count: 'exact' });

  if (search) {
    const sanitized = sanitizeIlikeSearch(search);
    if (sanitized) {
      query = query.or(`name.ilike.%${sanitized}%,owner_email.ilike.%${sanitized}%`);
    }
  }

  if (plan) {
    if (plan === 'free') {
      query = query.is('plan_name', null);
    } else {
      query = query.eq('plan_name', plan);
    }
  }

  if (type) {
    query = query.eq('business_type', type);
  }

  if (status) {
    query = query.eq('subscription_status', status);
  }

  query = query
    .order(sort, { ascending: order })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const [dataResult, facetResult] = await Promise.all([
    query,
    service.rpc('get_admin_business_facets'),
  ]);

  if (dataResult.error) {
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 },
    );
  }

  const facetsRaw = (facetResult.data ?? {
    plans: {},
    types: {},
    statuses: {},
  }) as {
    plans: Record<string, number>;
    types: Record<string, number>;
    statuses: Record<string, number>;
  };

  const response: AdminBusinessListResponse = {
    businesses: (dataResult.data ?? []) as unknown as AdminBusinessStats[],
    totalCount: dataResult.count ?? 0,
    facets: {
      plans: facetsRaw.plans ?? {},
      types: facetsRaw.types ?? {},
      statuses: facetsRaw.statuses ?? {},
    },
    adminEmail: user.email,
  };

  return NextResponse.json(response);
}
