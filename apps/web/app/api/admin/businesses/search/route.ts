import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import type { BusinessSearchResult } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const service = createAdminServiceClient();

  const { data, error } = await service
    .from('admin_business_stats')
    .select('id, name, owner_email, plan_name')
    .or(`name.ilike.%${q}%,owner_email.ilike.%${q}%`)
    .limit(5);

  if (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  interface SearchRow {
    id: string;
    name: string;
    owner_email: string | null;
    plan_name: string | null;
  }

  const results: BusinessSearchResult[] = (data as SearchRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    ownerEmail: row.owner_email,
    planName: row.plan_name,
  }));

  return NextResponse.json(results);
}
