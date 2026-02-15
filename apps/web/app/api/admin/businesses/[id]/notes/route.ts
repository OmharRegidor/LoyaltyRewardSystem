import { NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabaseClient,
  createAdminServiceClient,
} from '@/lib/supabase-server';
import { isAdminEmail } from '@/lib/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface NoteRequestBody {
  content: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as NoteRequestBody;
  const { content } = body;

  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json(
      { error: 'content is required' },
      { status: 400 },
    );
  }

  const service = createAdminServiceClient();

  const { data, error } = await service
    .from('admin_notes')
    .insert({
      business_id: id,
      author_email: user.email,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
