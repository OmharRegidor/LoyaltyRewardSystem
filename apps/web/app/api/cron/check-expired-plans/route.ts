import { NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (production) or has valid auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createAdminServiceClient();

  // Find the free plan
  const { data: freePlan } = await service
    .from('plans')
    .select('id')
    .eq('name', 'free')
    .single();

  if (!freePlan) {
    return NextResponse.json({ error: 'Free plan not found' }, { status: 500 });
  }

  // Find all expired Enterprise subscriptions
  const { data: expired } = await service
    .from('subscriptions')
    .select('id, business_id, plan_id')
    .eq('status', 'active')
    .eq('is_free_forever', false)
    .lt('current_period_end', new Date().toISOString());

  if (!expired || expired.length === 0) {
    return NextResponse.json({ downgraded: 0 });
  }

  let downgraded = 0;

  for (const sub of expired) {
    const { error } = await service
      .from('subscriptions')
      .update({
        plan_id: freePlan.id,
        status: 'active',
        is_free_forever: true,
        module_pos_override: false,
        billing_interval: 'monthly',
        current_period_start: null,
        current_period_end: null,
      })
      .eq('id', sub.id);

    if (!error) {
      // Audit trail
      await service.from('admin_plan_changes').insert({
        business_id: sub.business_id,
        changed_by_email: 'system@noxaloyalty.com',
        old_plan_id: sub.plan_id,
        new_plan_id: freePlan.id,
        reason: 'Auto-downgrade: Enterprise plan period expired (cron)',
      });
      downgraded++;
    }
  }

  return NextResponse.json({ downgraded, checked: expired.length });
}
