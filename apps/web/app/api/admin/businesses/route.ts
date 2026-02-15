// apps/web/app/api/admin/businesses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabaseClient,
  createAdminServiceClient,
} from '@/lib/supabase-server';
import { isAdminEmail } from '@/lib/admin';
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
  // Auth check
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
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
    query = query.or(`name.ilike.%${search}%,owner_email.ilike.%${search}%`);
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

  // Facet query (all rows, just the columns we need for counts)
  const facetQuery = service
    .from('admin_business_stats')
    .select('plan_name, business_type, subscription_status');

  const [dataResult, facetResult] = await Promise.all([query, facetQuery]);

  if (dataResult.error) {
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 },
    );
  }

  // Compute facet counts
  interface FacetRow {
    plan_name: string | null;
    business_type: string | null;
    subscription_status: string;
  }

  const facetRows = (facetResult.data ?? []) as FacetRow[];
  const plans: Record<string, number> = {};
  const types: Record<string, number> = {};
  const statuses: Record<string, number> = {};

  for (const row of facetRows) {
    const p = row.plan_name ?? 'free';
    plans[p] = (plans[p] ?? 0) + 1;

    if (row.business_type) {
      types[row.business_type] = (types[row.business_type] ?? 0) + 1;
    }

    const s = row.subscription_status;
    statuses[s] = (statuses[s] ?? 0) + 1;
  }

  const response: AdminBusinessListResponse = {
    businesses: (dataResult.data ?? []) as unknown as AdminBusinessStats[],
    totalCount: dataResult.count ?? 0,
    facets: { plans, types, statuses },
    adminEmail: user.email,
  };

  return NextResponse.json(response);
}
