import { NextRequest, NextResponse } from 'next/server';
import { createAdminServiceClient } from '@/lib/supabase-server';
import { getApiUser } from '@/lib/server-auth';
import { isAdmin } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface TagRequestBody {
  tag: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as TagRequestBody;
  const { tag } = body;

  if (!tag || typeof tag !== 'string' || !tag.trim()) {
    return NextResponse.json({ error: 'tag is required' }, { status: 400 });
  }

  const service = createAdminServiceClient();

  const { data, error } = await service
    .from('admin_tags')
    .upsert(
      { business_id: id, tag: tag.trim().toLowerCase() },
      { onConflict: 'business_id,tag' },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to add tag' },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getApiUser();

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as TagRequestBody;
  const { tag } = body;

  if (!tag || typeof tag !== 'string') {
    return NextResponse.json({ error: 'tag is required' }, { status: 400 });
  }

  const service = createAdminServiceClient();

  const { error } = await service
    .from('admin_tags')
    .delete()
    .eq('business_id', id)
    .eq('tag', tag.trim().toLowerCase());

  if (error) {
    return NextResponse.json(
      { error: 'Failed to remove tag' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
