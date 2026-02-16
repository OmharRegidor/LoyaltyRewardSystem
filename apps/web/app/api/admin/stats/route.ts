// apps/web/app/api/admin/stats/route.ts

import { NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';
import type { AdminPlatformStats, AdminBusinessStats } from '@/lib/admin';

interface AdminStatsResponse {
  stats: AdminPlatformStats;
  topBusinesses: AdminBusinessStats[];
  recentBusinesses: AdminBusinessStats[];
  adminEmail: string;
}

export async function GET() {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createAdminServiceClient();

  // Fetch all data in parallel
  const [platformResult, topResult, recentResult] = await Promise.all([
    service.from('admin_platform_stats').select('*').single(),
    service
      .from('admin_business_stats')
      .select('*')
      .order('transactions_30d', { ascending: false })
      .limit(5),
    service
      .from('admin_business_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (platformResult.error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 },
    );
  }

  const response: AdminStatsResponse = {
    stats: platformResult.data as unknown as AdminPlatformStats,
    topBusinesses: (topResult.data ?? []) as unknown as AdminBusinessStats[],
    recentBusinesses: (recentResult.data ??
      []) as unknown as AdminBusinessStats[],
    adminEmail: user.email,
  };

  return NextResponse.json(response);
}
