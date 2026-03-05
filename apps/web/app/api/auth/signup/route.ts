import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/security';

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  businessName: z.string().min(2).max(100),
  businessType: z.enum(['retail', 'restaurant', 'salon', 'hotel']),
  phone: z.string().regex(/^\+63\d{10}$/, 'Invalid Philippine phone number'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Per-email rate limit: 3 attempts / 60 min
    const rateLimit = checkRateLimit(email, 'signup');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:3000');

    const supabase = await createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.businessName,
          display_name: parsed.data.businessName,
          phone: parsed.data.phone,
          role: 'business_owner',
          business_name: parsed.data.businessName,
          business_type: parsed.data.businessType,
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please login instead.' },
          { status: 409 },
        );
      }

      if (
        authError.message.toLowerCase().includes('sending confirmation email')
      ) {
        return NextResponse.json({
          needsEmailConfirmation: true,
          emailSendFailed: true,
        });
      }

      return NextResponse.json(
        { error: 'Signup failed. Please try again.' },
        { status: 500 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      needsEmailConfirmation: true,
      emailSendFailed: false,
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
