// apps/web/lib/admin.ts

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from './supabase-server';

// ============================================
// TYPES
// ============================================

export interface AdminPlatformStats {
  total_businesses: number;
  businesses_30d: number;
  businesses_7d: number;
  enterprise_count: number;
  free_count: number;
  total_customers: number;
  customers_30d: number;
  total_transactions: number;
  transactions_30d: number;
  total_points_issued: number;
  points_issued_30d: number;
  total_bookings: number;
  bookings_30d: number;
  active_subscriptions: number;
}

export interface AdminBusinessStats {
  id: string;
  name: string;
  slug: string;
  owner_email: string | null;
  created_at: string | null;
  subscription_status: string;
  business_type: string | null;
  phone: string | null;
  plan_name: string | null;
  customer_count: number;
  staff_count: number;
  transaction_count: number;
  transactions_30d: number;
  branch_count: number;
  points_issued: number;
  last_active_at: string | null;
}

export interface AdminBusinessListResponse {
  businesses: AdminBusinessStats[];
  totalCount: number;
  facets: {
    plans: Record<string, number>;
    types: Record<string, number>;
    statuses: Record<string, number>;
  };
  adminEmail: string;
}

export interface AdminNote {
  id: string;
  business_id: string;
  author_email: string;
  content: string;
  created_at: string;
}

export interface AdminTag {
  id: string;
  business_id: string;
  tag: string;
  created_at: string;
}

export interface AdminPlanChange {
  id: string;
  business_id: string;
  changed_by_email: string;
  old_plan_id: string | null;
  new_plan_id: string | null;
  old_plan_name: string | null;
  new_plan_name: string | null;
  reason: string | null;
  created_at: string;
}

export interface PlanOption {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number | null;
  price_annual: number | null;
}

export interface BusinessSearchResult {
  id: string;
  name: string;
  ownerEmail: string | null;
  planName: string | null;
}

export interface PlanChangeRow {
  id: string;
  businessId: string;
  businessName: string;
  oldPlanName: string | null;
  newPlanName: string | null;
  changedByEmail: string;
  reason: string | null;
  createdAt: string;
}

export interface PlanChangesResponse {
  changes: PlanChangeRow[];
  plans: PlanOption[];
}

export interface EnterpriseAccount {
  id: string;
  businessId: string;
  businessName: string;
  ownerEmail: string | null;
  upgradedAt: string;
  planName: string;
  hasBooking: boolean;
  hasPos: boolean;
}

export interface ActivityDataPoint {
  day: string;
  transactions: number;
  new_customers: number;
  points_earned: number;
}

export interface BusinessDetailResponse {
  business: {
    id: string;
    name: string;
    slug: string;
    owner_email: string | null;
    created_at: string | null;
    subscription_status: string;
    business_type: string | null;
    phone: string | null;
    city: string | null;
    address: string | null;
    logo_url: string | null;
    points_per_purchase: number | null;
    plan_name: string | null;
    billing_interval: string | null;
    current_period_end: string | null;
    current_plan_id: string | null;
    has_booking: boolean;
    has_pos: boolean;
    has_loyalty: boolean;
  };
  stats: {
    customer_count: number;
    staff_count: number;
    transaction_count: number;
    transactions_30d: number;
    branch_count: number;
    points_issued: number;
    new_customers_30d: number;
    points_issued_30d: number;
    bookings_30d: number;
    active_rewards: number;
    active_services: number;
    last_active_at: string | null;
  };
  notes: AdminNote[];
  tags: AdminTag[];
  planChanges: AdminPlanChange[];
  activityTrend: ActivityDataPoint[];
  availablePlans: PlanOption[];
}

// ============================================
// HELPERS
// ============================================

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

export function verifyAdminPin(pin: string): boolean {
  const expected = process.env.ADMIN_PIN ?? '';
  if (!expected) return false;
  return pin === expected;
}

// ============================================
// COOKIE-BASED PIN VERIFICATION
// ============================================

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function buildCookieValue(email: string): Promise<string> {
  const pin = process.env.ADMIN_PIN ?? '';
  const hash = await sha256(pin + email.toLowerCase());
  const raw = email.toLowerCase() + ':' + hash;
  return Buffer.from(raw).toString('base64');
}

export async function setAdminVerifiedCookie(email: string): Promise<void> {
  const cookieStore = await cookies();
  const value = await buildCookieValue(email);
  cookieStore.set('admin_verified', value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/admin',
  });
}

export async function isAdminVerified(
  cookieValue: string,
  email: string,
): Promise<boolean> {
  const expected = await buildCookieValue(email);
  return cookieValue === expected;
}

// ============================================
// SERVER COMPONENT GUARD
// ============================================

export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  const email = user.email.toLowerCase();

  if (!isAdminEmail(email)) {
    redirect('/');
  }

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('admin_verified')?.value;

  if (!adminCookie) {
    redirect('/admin/verify');
  }

  const valid = await isAdminVerified(adminCookie, email);
  if (!valid) {
    redirect('/admin/verify');
  }

  return { email };
}
