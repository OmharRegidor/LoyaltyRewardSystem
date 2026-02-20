// apps/web/app/api/public/verify/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBusinessByJoinCode } from '@/lib/services/public-business.service';
import { sendEmailVerification } from '@/lib/services/verification.service';

// ============================================
// VALIDATION
// ============================================

const SendVerifySchema = z.object({
  email: z.string().email('Invalid email address'),
  joinCode: z.string().min(1, 'Join code is required'),
});

// ============================================
// POST: Send verification code
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = SendVerifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, joinCode } = validation.data;

    // Validate join code matches a real business
    const business = await getBusinessByJoinCode(joinCode);
    if (!business) {
      return NextResponse.json(
        { error: 'Invalid join code' },
        { status: 404 },
      );
    }

    // Send verification email
    const result = await sendEmailVerification(
      email,
      business.id,
      business.name,
      'signup',
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code' },
        { status: 429 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
