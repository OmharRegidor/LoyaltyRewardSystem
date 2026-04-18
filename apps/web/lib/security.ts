// apps/web/lib/security.ts

import { headers } from 'next/headers';
import { createServiceClient } from './supabase-server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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

// Lazy Redis singleton — only initialized when env vars are present
let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// Cache Ratelimit instances per endpoint type
const _limiters = new Map<string, Ratelimit>();
function getRatelimiter(endpointType: string, config: RateLimitConfig): Ratelimit {
  const cached = _limiters.get(endpointType);
  if (cached) return cached;

  const redis = getRedis();
  if (!redis) {
    // Should not be called when Redis is absent; caller guards this
    throw new Error('Redis not configured');
  }

  const windowSeconds = Math.round(config.windowMs / 1000);
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSeconds} s`),
    prefix: `rl:${endpointType}`,
  });
  _limiters.set(endpointType, limiter);
  return limiter;
}

/**
 * Check rate limit for a given key and endpoint type.
 * Falls open (allowed: true) if Redis is not configured.
 */
export async function checkRateLimit(
  key: string,
  endpointType: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpointType];
  if (!config) {
    return { allowed: true, remaining: Infinity, resetAt: new Date() };
  }

  // Fall open when Redis is not configured (local dev or missing env vars)
  const redis = getRedis();
  if (!redis) {
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date() };
  }

  const limiter = getRatelimiter(endpointType as string, config);
  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: new Date(result.reset),
    };
  } catch (err) {
    // Redis is configured but unreachable — fail closed to prevent abuse.
    console.error('[rate-limit] Redis error, failing closed:', err);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
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
 * Detect rapid signups from same IP
 */
export async function checkSignupAbuse(ip: string): Promise<AbuseCheckResult> {
  const result = await checkRateLimit(ip, 'signup');

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
  const supabase = createServiceClient();

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
  const supabase = createServiceClient();

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
 * Sanitize search input for use in PostgREST .or() filter strings.
 * Strips characters that could inject additional filter conditions.
 */
export function sanitizePostgrestFilter(input: string): string {
  return input
    .replace(/[,().%_*\[\]{}!&|]/g, '')
    .trim()
    .slice(0, 100);
}

/**
 * Escape ILIKE wildcard characters (% and _) so they are treated as literals.
 * Also strips PostgREST operator delimiters for .or() safety.
 */
export function sanitizeIlikeSearch(input: string): string {
  return input
    .replace(/[,().]/g, '')       // prevent PostgREST filter injection
    .replace(/%/g, '\\%')         // escape ILIKE wildcard
    .replace(/_/g, '\\_')         // escape ILIKE single-char wildcard
    .trim()
    .slice(0, 100);
}

/**
 * Validate ISO date string format (YYYY-MM-DD)
 */
export function isValidISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
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
  details: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const supabase = createServiceClient();

  await supabase.from('audit_logs').insert({
    event_type: event.type,
    severity: event.severity,
    business_id: event.businessId,
    user_id: event.userId,
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
  const supabase = createServiceClient();

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
