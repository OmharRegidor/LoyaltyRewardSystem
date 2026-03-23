import { NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';

interface TrialBusiness {
  business_id: string;
  business_name: string;
  owner_email: string | null;
  business_type: string | null;
  trial_ends_at: string;
  status: string;
  created_at: string | null;
}

export async function GET() {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createAdminServiceClient();

  // Fetch all subscriptions that have a trial_ends_at set (past or present trials)
  const { data: trials, error } = await service
    .from('subscriptions')
    .select(
      `
      business_id,
      trial_ends_at,
      status,
      created_at,
      businesses:business_id (
        name,
        owner_email,
        business_type
      )
    `
    )
    .not('trial_ends_at', 'is', null)
    .order('trial_ends_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch trials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trials' },
      { status: 500 }
    );
  }

  const result: TrialBusiness[] = (trials ?? []).map((t) => {
    const biz = Array.isArray(t.businesses) ? t.businesses[0] : t.businesses;
    return {
      business_id: t.business_id,
      business_name: (biz as Record<string, unknown>)?.name as string ?? 'Unknown',
      owner_email: (biz as Record<string, unknown>)?.owner_email as string | null ?? null,
      business_type: (biz as Record<string, unknown>)?.business_type as string | null ?? null,
      trial_ends_at: t.trial_ends_at!,
      status: t.status,
      created_at: t.created_at,
    };
  });

  return NextResponse.json({ trials: result });
}
