import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import { sanitizeIlikeSearch } from '@/lib/security';

const PAGE_SIZE = 25;

export interface AdminBusinessCustomerRow {
  customerId: string;
  email: string | null;
  phone: string | null;
  points: number;
  followedAt: string | null;
  transactionCount: number;
  lastTransactionAt: string | null;
}

export interface AdminBusinessCustomersResponse {
  customers: AdminBusinessCustomerRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: businessId } = await params;

  const query = request.nextUrl.searchParams;
  const rawSearch = query.get('search') ?? '';
  const search = sanitizeIlikeSearch(rawSearch);
  const page = Math.max(1, parseInt(query.get('page') || '1', 10));

  const service = createAdminServiceClient();

  const { data, error } = await service.rpc('admin_list_business_customers', {
    p_business_id: businessId,
    p_search: search || undefined,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }

  const rows = (data ?? []) as Array<{
    customer_id: string;
    email: string | null;
    phone: string | null;
    points: number;
    followed_at: string | null;
    transaction_count: number;
    last_transaction_at: string | null;
    total_count: number;
  }>;

  const customers: AdminBusinessCustomerRow[] = rows.map((r) => ({
    customerId: r.customer_id,
    email: r.email,
    phone: r.phone,
    points: r.points ?? 0,
    followedAt: r.followed_at,
    transactionCount: Number(r.transaction_count ?? 0),
    lastTransactionAt: r.last_transaction_at,
  }));

  const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;

  const response: AdminBusinessCustomersResponse = {
    customers,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
  };

  return NextResponse.json(response);
}
