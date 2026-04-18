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
    const rateLimit = await checkRateLimit(email, 'password_reset');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 },
      );
    }

    // Send password reset email using service client (no PKCE).
    // This ensures the reset link works regardless of which browser
    // or context the user opens the email link in.
    const { createServiceClient } = await import('@/lib/supabase-server');
    const supabase = createServiceClient();

    const host = request.headers.get('host') || 'noxaloyalty.com';
    const origin = `https://${host}`;

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
