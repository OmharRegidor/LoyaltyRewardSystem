import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import { sanitizeIlikeSearch } from '@/lib/security';

const MAX_EXPORT_ROWS = 5000;
const SORT_WHITELIST = [
  'transactions_30d',
  'customer_count',
  'created_at',
  'name',
] as const;

function csvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createAdminServiceClient();
  const params = request.nextUrl.searchParams;

  const search = params.get('search')?.trim() ?? '';
  const plan = params.get('plan') ?? '';
  const type = params.get('type') ?? '';
  const status = params.get('status') ?? '';
  const sortParam = params.get('sort') ?? 'created_at';
  const order = params.get('order') === 'asc';
  const sort = (SORT_WHITELIST as readonly string[]).includes(sortParam) ? sortParam : 'created_at';

  let query = service
    .from('admin_business_stats')
    .select('*')
    .order(sort, { ascending: order })
    .limit(MAX_EXPORT_ROWS);

  if (search) {
    const sanitized = sanitizeIlikeSearch(search);
    if (sanitized) {
      query = query.or(`name.ilike.%${sanitized}%,owner_email.ilike.%${sanitized}%`);
    }
  }
  if (plan) {
    if (plan === 'free') query = query.is('plan_name', null);
    else query = query.eq('plan_name', plan);
  }
  if (type) query = query.eq('business_type', type);
  if (status) query = query.eq('subscription_status', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }

  const headers = [
    'Name',
    'Owner Email',
    'Plan',
    'Status',
    'Type',
    'Customers',
    'Transactions (30d)',
    'Staff',
    'Branches',
    'Points Issued',
    'Last Active',
    'Created',
  ];

  const rows = (data ?? []).map((b) =>
    [
      csvField(b.name),
      csvField(b.owner_email),
      csvField(b.plan_name ?? 'Free'),
      csvField(b.subscription_status),
      csvField(b.business_type),
      csvField(b.customer_count),
      csvField(b.transactions_30d),
      csvField(b.staff_count),
      csvField(b.branch_count),
      csvField(b.points_issued),
      csvField(b.last_active_at ? new Date(b.last_active_at).toISOString() : ''),
      csvField(b.created_at ? new Date(b.created_at).toISOString().slice(0, 10) : ''),
    ].join(','),
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="businesses-${dateStr}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
