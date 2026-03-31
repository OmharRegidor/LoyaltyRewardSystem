import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/security';

const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: true });
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Per-email rate limit: 3 attempts / 60 min
    const rateLimit = checkRateLimit(email, 'password_reset');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 },
      );
    }

    // Rate limit passed — the actual resetPasswordForEmail call
    // is made from the client-side Supabase client to ensure
    // PKCE code_verifier is stored properly in the browser
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
