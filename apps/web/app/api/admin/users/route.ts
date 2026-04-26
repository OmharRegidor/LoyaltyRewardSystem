import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import { sanitizeIlikeSearch } from '@/lib/security';

const PAGE_SIZE = 25;

const ALLOWED_ROLES = ['business_owner', 'staff', 'customer', 'admin'] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

interface AdminUserRow {
  userId: string;
  email: string | null;
  role: AllowedRole | string;
  createdAt: string | null;
  businessId: string | null;
  businessName: string | null;
  businessCount: number;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const roleParam = params.get('role');
  const role = roleParam && (ALLOWED_ROLES as readonly string[]).includes(roleParam) ? roleParam : null;

  const rawSearch = params.get('search') ?? '';
  const search = sanitizeIlikeSearch(rawSearch);

  const page = Math.max(1, parseInt(params.get('page') || '1', 10));

  const service = createAdminServiceClient();

  const { data, error } = await service.rpc('admin_list_users', {
    p_role: role ?? undefined,
    p_search: search || undefined,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  const rows = (data ?? []) as Array<{
    user_id: string;
    email: string | null;
    role: string;
    created_at: string | null;
    business_id: string | null;
    business_name: string | null;
    business_count: number;
    total_count: number;
  }>;

  const users: AdminUserRow[] = rows.map((r) => ({
    userId: r.user_id,
    email: r.email,
    role: r.role,
    createdAt: r.created_at,
    businessId: r.business_id,
    businessName: r.business_name,
    businessCount: r.business_count,
  }));

  const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;

  const response: AdminUsersResponse = {
    users,
    totalCount,
    page,
    pageSize: PAGE_SIZE,
  };

  return NextResponse.json(response);
}
