// apps/web/lib/services/verification.service.ts

import { createServiceClient } from '@/lib/supabase-server';
import { sendVerificationEmail } from '@/lib/email';

// ============================================
// TYPES
// ============================================

interface SendVerificationResult {
  success: boolean;
  error?: string;
}

interface VerifyCodeResult {
  success: boolean;
  verificationId?: string;
  purpose?: string;
  error?: string;
  attemptsRemaining?: number;
}

// ============================================
// CONSTANTS
// ============================================

const CODE_LENGTH = 6;
const CODE_EXPIRY_MINUTES = 10;
const MAX_CODES_PER_HOUR = 3;

// ============================================
// HELPERS
// ============================================

function generateOTPCode(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

// ============================================
// SEND EMAIL VERIFICATION
// ============================================

export async function sendEmailVerification(
  email: string,
  businessId: string,
  businessName: string,
  purpose: string = 'signup'
): Promise<SendVerificationResult> {
  const supabase = createServiceClient();
  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit via existing RPC
  const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
    p_identifier: normalizedEmail,
    p_identifier_type: 'email',
    p_action: 'verification_code',
    p_max_requests: MAX_CODES_PER_HOUR,
    p_window_seconds: 3600,
  });

  if (rateLimitOk === false) {
    return {
      success: false,
      error: 'Too many verification attempts. Please try again in an hour.',
    };
  }

  // Generate code and store
  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Use `any` cast since verification_codes table isn't in generated types yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from('verification_codes')
    .insert({
      email: normalizedEmail,
      code,
      business_id: businessId,
      purpose,
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: 5,
    });

  if (insertError) {
    console.error('Failed to store verification code:', insertError);
    return { success: false, error: 'Failed to send verification code.' };
  }

  // Send email
  const emailResult = await sendVerificationEmail({
    to: normalizedEmail,
    code,
    businessName,
  });

  if (!emailResult.success) {
    return { success: false, error: 'Failed to send verification email.' };
  }

  return { success: true };
}

// ============================================
// VERIFY CODE
// ============================================

export async function verifyCode(
  code: string,
  email: string,
  businessId: string
): Promise<VerifyCodeResult> {
  const supabase = createServiceClient();

  // Use `any` cast since verify_customer_otp RPC isn't in generated types yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('verify_customer_otp', {
    p_code: code,
    p_email: email.toLowerCase().trim(),
    p_business_id: businessId,
  });

  if (error) {
    console.error('Verify OTP RPC error:', error);
    return { success: false, error: 'Verification failed. Please try again.' };
  }

  const result = data as {
    success: boolean;
    error?: string;
    message?: string;
    verification_id?: string;
    purpose?: string;
    attempts_remaining?: number;
  };

  if (!result.success) {
    return {
      success: false,
      error: result.message || 'Invalid verification code.',
      attemptsRemaining: result.attempts_remaining,
    };
  }

  return {
    success: true,
    verificationId: result.verification_id,
    purpose: result.purpose,
  };
}

// ============================================
// CHECK IF EMAIL HAS VERIFIED CODE
// ============================================

export async function hasVerifiedCode(
  email: string,
  businessId: string
): Promise<boolean> {
  const supabase = createServiceClient();

  // Use `any` cast since verification_codes table isn't in generated types yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('verification_codes')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('business_id', businessId)
    .not('verified_at', 'is', null)
    .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle();

  return !!data;
}
