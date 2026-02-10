import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { z } from 'zod';

const EmailSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = EmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const email = parsed.data.email;

  const [businessResult, staffResult] = await Promise.all([
    serviceClient.from('businesses').select('id').eq('owner_email', email).maybeSingle(),
    serviceClient.from('staff').select('id').eq('email', email).maybeSingle(),
  ]);

  return NextResponse.json({ exists: !!(businessResult.data || staffResult.data) });
}
