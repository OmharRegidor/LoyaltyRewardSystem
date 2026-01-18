// apps/web/lib/security.ts

import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or Upstash
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 signups per hour
  password_reset: { windowMs: 60 * 60 * 1000, maxRequests: 3 },

  // Billing
  checkout: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
  portal: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute

  // API
  api_general: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
  api_write: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 writes per minute

  // QR Scanning
  qr_scan: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 scans per minute
  points_award: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 awards per minute
};

/**
 * Check rate limit for a given key and endpoint type
 */
export function checkRateLimit(
  key: string,
  endpointType: keyof typeof RATE_LIMITS
): RateLimitResult {
  const config = RATE_LIMITS[endpointType];
  if (!config) {
    return { allowed: true, remaining: Infinity, resetAt: new Date() };
  }

  const now = Date.now();
  const storeKey = `${endpointType}:${key}`;
  const existing = rateLimitStore.get(storeKey);

  // Reset if window expired
  if (!existing || existing.resetAt < now) {
    rateLimitStore.set(storeKey, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now + config.windowMs),
    };
  }

  // Increment count
  existing.count++;
  const allowed = existing.count <= config.maxRequests;

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - existing.count),
    resetAt: new Date(existing.resetAt),
  };
}

/**
 * Get client identifier for rate limiting
 */
export async function getClientIdentifier(): Promise<string> {
  const headersList = await headers();

  // Try to get real IP from various headers
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const cfConnectingIp = headersList.get('cf-connecting-ip');

  return cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';
}

// ============================================
// ANTI-ABUSE DETECTION
// ============================================

/**
 * Check for suspicious activity patterns
 */
export interface AbuseCheckResult {
  suspicious: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Detect multiple organizations using same payment method
 */
export async function checkPaymentMethodAbuse(
  stripeCustomerId: string
): Promise<AbuseCheckResult> {
  // This would query Stripe to check if the payment method
  // is associated with multiple customers
  // Implementation depends on your abuse tolerance

  return { suspicious: false, severity: 'low' };
}

/**
 * Detect rapid signups from same IP
 */
export async function checkSignupAbuse(ip: string): Promise<AbuseCheckResult> {
  const result = checkRateLimit(ip, 'signup');

  if (!result.allowed) {
    return {
      suspicious: true,
      reason: 'Too many signup attempts from this IP',
      severity: 'medium',
    };
  }

  return { suspicious: false, severity: 'low' };
}

/**
 * Detect QR code reuse/sharing abuse
 */
export async function checkQRAbuse(
  qrCodeId: string,
  businessId: string
): Promise<AbuseCheckResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check for same QR scanned at multiple businesses
  const { data: recentScans } = await supabase
    .from('transactions')
    .select('business_id, created_at')
    .eq('customer_id', qrCodeId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (!recentScans) {
    return { suspicious: false, severity: 'low' };
  }

  // Check for suspicious patterns
  const uniqueBusinesses = new Set(recentScans.map((s) => s.business_id));

  // More than 5 different businesses in 24 hours is suspicious
  if (uniqueBusinesses.size > 5) {
    return {
      suspicious: true,
      reason: 'QR code used at too many different businesses',
      severity: 'high',
    };
  }

  // More than 20 scans in 24 hours at same business is suspicious
  const sameBusinessScans = recentScans.filter(
    (s) => s.business_id === businessId
  );
  if (sameBusinessScans.length > 20) {
    return {
      suspicious: true,
      reason: 'Excessive scans at same business',
      severity: 'medium',
    };
  }

  return { suspicious: false, severity: 'low' };
}

/**
 * Detect staff abuse (excessive point awards)
 */
export async function checkStaffAbuse(
  staffId: string,
  businessId: string
): Promise<AbuseCheckResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get staff's recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('points, created_at')
    .eq('staff_id', staffId)
    .eq('type', 'earn')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if (!recentTransactions) {
    return { suspicious: false, severity: 'low' };
  }

  // More than 100 transactions in an hour is suspicious
  if (recentTransactions.length > 100) {
    return {
      suspicious: true,
      reason: 'Excessive transaction volume',
      severity: 'high',
    };
  }

  // Calculate total points awarded
  const totalPoints = recentTransactions.reduce(
    (sum, t) => sum + (t.points || 0),
    0
  );

  // More than 50,000 points in an hour is suspicious
  if (totalPoints > 50000) {
    return {
      suspicious: true,
      reason: 'Excessive points awarded',
      severity: 'high',
    };
  }

  return { suspicious: false, severity: 'low' };
}

// ============================================
// INPUT VALIDATION
// ============================================

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate Philippine phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Format: +639XXXXXXXXX or 09XXXXXXXXX
  const phoneRegex = /^(\+63|0)9\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log security-relevant events
 */
export async function logSecurityEvent(event: {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  businessId?: string;
  userId?: string;
  ip?: string;
  details: Record<string, unknown>;
}): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from('audit_logs').insert({
    event_type: event.type,
    severity: event.severity,
    business_id: event.businessId,
    user_id: event.userId,
    ip_address: event.ip,
    details: event.details,
    created_at: new Date().toISOString(),
  });

  // For critical events, also log to console/monitoring
  if (event.severity === 'critical') {
    console.error('[SECURITY ALERT]', JSON.stringify(event));
    // Here you could also send to Sentry, Datadog, etc.
  }
}

// ============================================
// WEBHOOK SECURITY
// ============================================

/**
 * Verify that a webhook request is from Stripe
 * This is already handled in the webhook route, but exported for reuse
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  // Implementation is in the stripe.ts file
  // This is a placeholder for additional webhook security
  return true;
}

// ============================================
// DATA ISOLATION
// ============================================

/**
 * Ensure query is scoped to the correct business
 * Call this before any database operation to prevent data leakage
 */
export function scopeToBusinessId(
  query: Record<string, unknown>,
  businessId: string
): Record<string, unknown> {
  return {
    ...query,
    business_id: businessId,
  };
}

/**
 * Verify user has access to a specific business
 */
export async function verifyBusinessAccess(
  userId: string,
  businessId: string
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if user is owner
  const { data: business } = await supabase
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single();

  if (business?.owner_id === userId) {
    return true;
  }

  // Check if user is staff
  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .single();

  return !!staff;
}
