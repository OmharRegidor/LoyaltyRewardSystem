// apps/web/app/api/staff/customer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server';
import { 
  generateQRToken, 
  generateQRCodeUrl, 
  generateCardToken,
  generateQRCodeDataUrl 
} from '@/lib/qr-code';
import { sendWelcomeEmail } from '@/lib/email';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMA
// ============================================

const AddCustomerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .transform((e) => e.toLowerCase().trim()),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(20, 'Phone too long')
    .regex(/^[\d\s\-+()]+$/, 'Invalid phone format'),
  age: z
    .number()
    .int()
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Invalid age')
    .optional(),
});

type AddCustomerInput = z.infer<typeof AddCustomerSchema>;

// ============================================
// RATE LIMIT CONSTANTS
// ============================================

const RATE_LIMIT = {
  maxRequests: 20,
  windowSeconds: 3600, // 1 hour
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function verifyStaffAndGetBusiness(supabase: ReturnType<typeof createServiceClient>, userId: string) {
  // Check if user is staff
  const { data: staffRecord, error: staffError } = await supabase
    .from('staff')
    .select('id, business_id, role, name, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (staffRecord) {
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, logo_url, address, city')
      .eq('id', staffRecord.business_id)
      .single();

    return {
      staffId: staffRecord.id,
      staffName: staffRecord.name,
      role: staffRecord.role,
      business,
    };
  }

  // Check if user is business owner
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, logo_url, address, city')
    .eq('owner_id', userId)
    .maybeSingle();

  if (business) {
    return {
      staffId: userId,
      staffName: 'Owner',
      role: 'owner',
      business,
    };
  }

  return null;
}

async function checkRateLimit(
  supabase: ReturnType<typeof createServiceClient>,
  staffId: string
): Promise<boolean> {
  const { data } = await supabase.rpc('check_rate_limit', {
    p_identifier: staffId,
    p_identifier_type: 'staff_id',
    p_action: 'add_customer',
    p_max_requests: RATE_LIMIT.maxRequests,
    p_window_seconds: RATE_LIMIT.windowSeconds,
  });

  return data === true;
}

async function logAuditEvent(
  supabase: ReturnType<typeof createServiceClient>,
  params: {
    actorId: string;
    actorType: 'staff' | 'owner';
    action: string;
    resourceType: string;
    resourceId?: string;
    businessId: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  await supabase.from('audit_logs').insert({
    actor_id: params.actorId,
    actor_type: params.actorType,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    business_id: params.businessId,
    details: params.details,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  });
}

// ============================================
// POST: Add Customer
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // 1. Authenticate user
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verify staff/owner and get business
    const serviceClient = createServiceClient();
    const staffInfo = await verifyStaffAndGetBusiness(serviceClient, user.id);

    if (!staffInfo || !staffInfo.business) {
      return NextResponse.json(
        { error: 'Not authorized as staff or business owner' },
        { status: 403 }
      );
    }

    // 3. Check rate limit
    const withinLimit = await checkRateLimit(serviceClient, staffInfo.staffId);
    if (!withinLimit) {
      await logAuditEvent(serviceClient, {
        actorId: staffInfo.staffId,
        actorType: staffInfo.role === 'owner' ? 'owner' : 'staff',
        action: 'add_customer_rate_limited',
        resourceType: 'customer',
        businessId: staffInfo.business.id,
        details: { reason: 'rate_limit_exceeded' },
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // 4. Parse and validate input
    const body = await request.json();
    const validation = AddCustomerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const input: AddCustomerInput = validation.data;

    // 5. Check if customer exists or create new
    let customerId: string;
    let isNewCustomer: boolean;
    let qrCodeUrl: string;
    let cardToken: string;

    const { data: existingCustomer } = await serviceClient
      .from('customers')
      .select('id, qr_code_url, card_token, full_name, email')
      .eq('email', input.email)
      .maybeSingle();

    if (existingCustomer) {
      // Customer exists - use existing QR code
      customerId = existingCustomer.id;
      qrCodeUrl = existingCustomer.qr_code_url!;
      cardToken = existingCustomer.card_token || generateCardToken(customerId);
      isNewCustomer = false;

      // Update card token if not exists
      if (!existingCustomer.card_token) {
        await serviceClient
          .from('customers')
          .update({ 
            card_token: cardToken,
            card_token_created_at: new Date().toISOString(),
          })
          .eq('id', customerId);
      }

      // Update name/phone if provided and currently empty
      await serviceClient
        .from('customers')
        .update({
          full_name: existingCustomer.full_name || input.fullName,
          phone: input.phone,
        })
        .eq('id', customerId);

    } else {
      // Create new customer
      const qrToken = generateQRToken();
      qrCodeUrl = generateQRCodeUrl(qrToken);
      
      const { data: newCustomer, error: createError } = await serviceClient
        .from('customers')
        .insert({
          email: input.email,
          full_name: input.fullName,
          phone: input.phone,
          total_points: 0,
          lifetime_points: 0,
          tier: 'bronze',
          qr_code_url: qrCodeUrl,
          created_by_staff_id: staffInfo.staffId,
          created_by_business_id: staffInfo.business.id,
        })
        .select('id')
        .single();

      if (createError || !newCustomer) {
        console.error('Create customer error:', createError);
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
      cardToken = generateCardToken(customerId);
      isNewCustomer = true;

      // Update with card token
      await serviceClient
        .from('customers')
        .update({ 
          card_token: cardToken,
          card_token_created_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    }

    // 6. Generate QR code image
    const qrCodeDataUrl = await generateQRCodeDataUrl(qrCodeUrl);

    // 7. Send welcome email
    const cardViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/card/${cardToken}`;
    
    const emailResult = await sendWelcomeEmail({
      to: input.email,
      customerName: input.fullName,
      businessName: staffInfo.business.name,
      businessLogo: staffInfo.business.logo_url,
      qrCodeDataUrl,
      cardViewUrl,
    });

    // 8. Update email sent tracking
    await serviceClient
      .from('customers')
      .update({
        email_sent_at: new Date().toISOString(),
        email_sent_count: existingCustomer 
          ? (existingCustomer as { email_sent_count?: number }).email_sent_count || 0 + 1 
          : 1,
      })
      .eq('id', customerId);

    // 9. Log audit event
    await logAuditEvent(serviceClient, {
      actorId: staffInfo.staffId,
      actorType: staffInfo.role === 'owner' ? 'owner' : 'staff',
      action: isNewCustomer ? 'customer_created' : 'customer_email_resent',
      resourceType: 'customer',
      resourceId: customerId,
      businessId: staffInfo.business.id,
      details: {
        customerEmail: input.email,
        customerName: input.fullName,
        isNewCustomer,
        emailSent: emailResult.success,
        processingTimeMs: Date.now() - startTime,
      },
      ipAddress,
      userAgent,
    });

    // 10. Return success response
    return NextResponse.json({
      success: true,
      data: {
        customerId,
        isNewCustomer,
        customerName: input.fullName,
        customerEmail: input.email,
        emailSent: emailResult.success,
        cardViewUrl,
      },
    });

  } catch (error) {
    console.error('Add customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}