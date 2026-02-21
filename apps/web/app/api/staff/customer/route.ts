// apps/web/app/api/staff/customer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  createServiceClient,
  createServerSupabaseClient,
} from '@/lib/supabase-server';
import { sendCustomerInviteEmail } from '@/lib/email';
import { z } from 'zod';
import type { Json } from '../../../../../../packages/shared/types/database';

// ============================================
// VALIDATION SCHEMA
// ============================================

const InviteCustomerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .transform((e) => e.toLowerCase().trim()),
});

// ============================================
// RATE LIMIT CONSTANTS
// ============================================

const RATE_LIMIT = {
  maxRequests: 100,
  windowSeconds: 3600,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

interface StaffBusiness {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  join_code: string | null;
}

interface StaffInfo {
  staffId: string;
  staffName: string;
  role: string;
  business: StaffBusiness | null;
}

async function verifyStaffAndGetBusiness(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<StaffInfo | null> {
  // Check if user is staff
  const { data: staffRecord } = await supabase
    .from('staff')
    .select('id, business_id, role, name, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (staffRecord) {
    // join_code column not in generated types yet (migration pending)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: business } = await (supabase as any)
      .from('businesses')
      .select('id, name, slug, logo_url, join_code')
      .eq('id', staffRecord.business_id)
      .single();

    return {
      staffId: staffRecord.id,
      staffName: staffRecord.name,
      role: staffRecord.role,
      business: business as StaffBusiness | null,
    };
  }

  // Check if user is business owner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: business } = await (supabase as any)
    .from('businesses')
    .select('id, name, slug, logo_url, join_code')
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) {
    return {
      staffId: userId,
      staffName: 'Owner',
      role: 'owner',
      business: business as StaffBusiness,
    };
  }

  return null;
}

async function checkRateLimit(
  supabase: ReturnType<typeof createServiceClient>,
  staffId: string,
): Promise<boolean> {
  const { data } = await supabase.rpc('check_rate_limit', {
    p_identifier: staffId,
    p_identifier_type: 'user_id',
    p_action: 'invite_customer',
    p_max_requests: RATE_LIMIT.maxRequests,
    p_window_seconds: RATE_LIMIT.windowSeconds,
  });

  return data === true;
}

async function logAuditEvent(
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    userId?: string;
    action: string;
    businessId: string;
    details: Record<string, unknown>;
  },
) {
  await supabase.from('audit_logs').insert({
    event_type: params.action,
    severity: 'info',
    business_id: params.businessId,
    user_id: params.userId ?? null,
    details: params.details as Json,
  });
}

// ============================================
// POST: Invite Customer
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  try {
    // 1. Authenticate user
    const serverSupabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify staff/owner and get business
    const serviceClient = createServiceClient();
    const staffInfo = await verifyStaffAndGetBusiness(serviceClient, user.id);

    if (!staffInfo || !staffInfo.business) {
      return NextResponse.json(
        { error: 'Not authorized as staff or business owner' },
        { status: 403 },
      );
    }

    // 3. Check rate limit
    const withinLimit = await checkRateLimit(serviceClient, staffInfo.staffId);
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }

    // 4. Parse and validate input
    const body = await request.json();
    const validation = InviteCustomerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email } = validation.data;

    // 5. Check if customer already exists for this business
    const { data: existingByEmail } = await serviceClient
      .from('customers')
      .select('id')
      .eq('email', email)
      .eq('created_by_business_id', staffInfo.business.id)
      .maybeSingle();

    if (existingByEmail) {
      return NextResponse.json({
        success: true,
        data: { alreadyRegistered: true },
      });
    }

    // 6. Send invite email
    const joinCode = staffInfo.business.join_code;

    if (joinCode) {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host') || request.nextUrl.host;
      const baseUrl = `${protocol}://${host}`;
      const joinUrl = `${baseUrl}/join/${joinCode}?email=${encodeURIComponent(email)}`;

      // Store verification code with purpose 'staff_invite'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient as any)
        .from('verification_codes')
        .insert({
          email,
          code: '000000', // placeholder — customer will go through full OTP flow
          business_id: staffInfo.business.id,
          purpose: 'staff_invite',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          attempts: 0,
          max_attempts: 5,
        });

      await sendCustomerInviteEmail({
        to: email,
        businessName: staffInfo.business.name,
        joinUrl,
      });
    }

    // 7. Log audit event
    await logAuditEvent(serviceClient, {
      userId: user.id,
      action: 'customer_invited',
      businessId: staffInfo.business.id,
      details: {
        staffId: staffInfo.staffId,
        inviteEmail: email,
        emailSent: !!joinCode,
        processingTimeMs: Date.now() - startTime,
        ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        alreadyRegistered: false,
        emailSent: !!joinCode,
      },
    });
  } catch (error) {
    console.error('Invite customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
