// apps/web/app/api/admin/businesses/tags/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';

interface TagRequestBody {
  businessIds: string[];
  tag: string;
}

export async function POST(request: NextRequest) {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as TagRequestBody;
  const { businessIds, tag } = body;

  if (
    !Array.isArray(businessIds) ||
    businessIds.length === 0 ||
    !tag ||
    typeof tag !== 'string'
  ) {
    return NextResponse.json(
      { error: 'businessIds (array) and tag (string) are required' },
      { status: 400 },
    );
  }

  const service = createAdminServiceClient();

  const rows = businessIds.map((id) => ({
    business_id: id,
    tag: tag.trim().toLowerCase(),
  }));

  const { error } = await service
    .from('admin_tags')
    .upsert(rows, { onConflict: 'business_id,tag' });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to apply tags' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, count: rows.length });
}
