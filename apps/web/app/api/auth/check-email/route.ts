import { NextRequest, NextResponse } from 'next/server';
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

  // Always return the same response to prevent user enumeration.
  // Supabase's resetPasswordForEmail already handles non-existent emails
  // gracefully (silently no-ops), so the caller doesn't need to pre-check.
  return NextResponse.json({ exists: true });
}
