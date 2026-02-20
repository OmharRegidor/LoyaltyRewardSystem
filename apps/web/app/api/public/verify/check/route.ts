// apps/web/app/api/public/verify/check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBusinessByJoinCode } from '@/lib/services/public-business.service';
import { verifyCode } from '@/lib/services/verification.service';

// ============================================
// VALIDATION
// ============================================

const CheckVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
  email: z.string().email('Invalid email address'),
  joinCode: z.string().min(1, 'Join code is required'),
});

// ============================================
// POST: Verify OTP code
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = CheckVerifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { code, email, joinCode } = validation.data;

    // Validate join code
    const business = await getBusinessByJoinCode(joinCode);
    if (!business) {
      return NextResponse.json(
        { error: 'Invalid join code' },
        { status: 404 },
      );
    }

    // Verify the code
    const result = await verifyCode(code, email, business.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid verification code' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      verificationId: result.verificationId,
    });
  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
