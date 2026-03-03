import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sendStaffInviteEmail } from '@/lib/email';
import { z } from 'zod';

const SendInviteEmailSchema = z.object({
  email: z.string().email(),
  staffName: z.string().min(1),
  businessName: z.string().min(1),
  inviteUrl: z.string().url(),
  role: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = SendInviteEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { email, staffName, businessName, inviteUrl, role } = parsed.data;

    // Validate inviteUrl matches our app domain to prevent phishing
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const allowedOrigin = new URL(appUrl).origin;
    try {
      const inviteOrigin = new URL(inviteUrl).origin;
      if (inviteOrigin !== allowedOrigin) {
        return NextResponse.json(
          { success: false, error: 'Invalid invite URL' },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid invite URL' },
        { status: 400 },
      );
    }

    const result = await sendStaffInviteEmail({
      to: email,
      staffName,
      businessName,
      inviteUrl,
      role,
    });

    return NextResponse.json({
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    console.error('Send staff invite email error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
