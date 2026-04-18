import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit, getClientIdentifier } from '@/lib/security';

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email or password format' },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Per-email rate limit: 5 attempts / 15 min
    const rateLimit = await checkRateLimit(email, 'login');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.password,
      });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 },
        );
      }
      if (signInError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please verify your email first.' },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: 'Login failed. Please try again.' },
        { status: 401 },
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Login failed. Please try again.' },
        { status: 401 },
      );
    }

    return NextResponse.json({
      userId: data.user.id,
      email: data.user.email,
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
