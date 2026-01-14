// apps/web/app/api/staff/customer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { sendWelcomeEmail } from '@/lib/email';

// ============================================
// SUPABASE CLIENTS
// ============================================

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}

// ============================================
// QR CODE HELPERS
// ============================================

function generateQRToken(): string {
  return crypto.randomBytes(12).toString('base64url');
}

function generateQRCodeUrl(token: string): string {
  return `loyaltyhub://customer/${token}`;
}

function generateCardToken(customerId: string): string {
  const secret = process.env.CARD_TOKEN_SECRET || 'default-secret-change-me';
  const payload = { customerId, createdAt: Date.now() };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
    'base64url'
  );
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');
  return `${payloadBase64}.${signature}`;
}

async function generateQRCodeDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 2,
    width: 300,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

// ============================================
// VALIDATION
// ============================================

const AddCustomerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .transform((e) => e.toLowerCase().trim()),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(20, 'Phone too long'),
  age: z
    .number()
    .int()
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Invalid age')
    .optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function verifyStaffAndGetBusiness(userId: string) {
  const supabase = createServiceClient();

  const { data: staffRecord } = await supabase
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

// ============================================
// POST: Add Customer
// ============================================

export async function POST(request: NextRequest) {
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
    const staffInfo = await verifyStaffAndGetBusiness(user.id);

    if (!staffInfo || !staffInfo.business) {
      return NextResponse.json(
        { error: 'Not authorized as staff or business owner' },
        { status: 403 }
      );
    }

    // 3. Parse and validate input
    const body = await request.json();
    const validation = AddCustomerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = validation.data;
    const serviceClient = createServiceClient();

    // 4. Check if customer exists or create new
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
      customerId = existingCustomer.id;
      qrCodeUrl = existingCustomer.qr_code_url!;
      cardToken = existingCustomer.card_token || generateCardToken(customerId);
      isNewCustomer = false;

      if (!existingCustomer.card_token) {
        await serviceClient
          .from('customers')
          .update({
            card_token: cardToken,
            card_token_created_at: new Date().toISOString(),
          })
          .eq('id', customerId);
      }

      await serviceClient
        .from('customers')
        .update({
          full_name: existingCustomer.full_name || input.fullName,
          phone: input.phone,
        })
        .eq('id', customerId);
    } else {
      const qrToken = generateQRToken();
      qrCodeUrl = generateQRCodeUrl(qrToken);

      const { data: newCustomer, error: createError } = await serviceClient
        .from('customers')
        .insert({
          user_id: null,
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

      await serviceClient
        .from('customers')
        .update({
          card_token: cardToken,
          card_token_created_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    }

    // 5. Generate QR code and send email
    const qrCodeDataUrl = await generateQRCodeDataUrl(qrCodeUrl);
    const cardViewUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }/card/${cardToken}`;

    // Send welcome email using the email utility
    const emailResult = await sendWelcomeEmail({
      to: input.email,
      customerName: input.fullName,
      businessName: staffInfo.business.name,
      businessLogo: staffInfo.business.logo_url,
      qrCodeContent: qrCodeUrl, // Pass the QR content URL, not base64
      cardViewUrl,
    });

    // Update email sent tracking
    if (emailResult.success) {
      await serviceClient
        .from('customers')
        .update({
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', customerId);
    }

    // 6. Return success
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
