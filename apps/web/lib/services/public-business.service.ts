// apps/web/lib/services/public-business.service.ts

import { createServiceClient } from '@/lib/supabase-server';
import type { Database } from '../../../../packages/shared/types/database';
import {
  generateQRToken,
  generateQRCodeUrl,
  generateCardToken,
} from '@/lib/qr-code';

type Business = Database['public']['Tables']['businesses']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type Reward = Database['public']['Tables']['rewards']['Row'];
type Availability = Database['public']['Tables']['availability']['Row'];

// ============================================
// TYPES
// ============================================

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  business_type: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  points_per_purchase: number | null;
  pesos_per_point: number | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_centavos: number | null;
}

export interface PublicReward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  category: string | null;
  image_url: string | null;
  stock: number | null;
}

export interface PublicAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// ============================================
// GET BUSINESS BY SLUG
// ============================================

export async function getBusinessBySlug(
  slug: string
): Promise<PublicBusiness | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('businesses')
    .select(
      `
      id,
      name,
      slug,
      description,
      logo_url,
      business_type,
      address,
      city,
      phone,
      points_per_purchase,
      pesos_per_point,
      subscription_status
    `
    )
    .eq('slug', slug)
    .in('subscription_status', ['active', 'trialing', 'free_forever'])
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    logo_url: data.logo_url,
    business_type: data.business_type,
    address: data.address,
    city: data.city,
    phone: data.phone,
    points_per_purchase: data.points_per_purchase,
    pesos_per_point: data.pesos_per_point,
  };
}

// ============================================
// GET PUBLIC SERVICES
// ============================================

export async function getPublicServices(
  businessId: string
): Promise<PublicService[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('services')
    .select(
      `
      id,
      name,
      description,
      duration_minutes,
      price_centavos
    `
    )
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching public services:', error);
    return [];
  }

  return data || [];
}

// ============================================
// GET PUBLIC REWARDS
// ============================================

export async function getPublicRewards(
  businessId: string
): Promise<PublicReward[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('rewards')
    .select(
      `
      id,
      title,
      description,
      points_cost,
      category,
      image_url,
      stock
    `
    )
    .eq('business_id', businessId)
    .eq('is_active', true)
    .eq('is_visible', true)
    .or('stock.is.null,stock.gt.0')
    .order('points_cost');

  if (error) {
    console.error('Error fetching public rewards:', error);
    return [];
  }

  return data || [];
}

// ============================================
// GET PUBLIC AVAILABILITY
// ============================================

export async function getPublicAvailability(
  businessId: string
): Promise<PublicAvailability[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('availability')
    .select(
      `
      day_of_week,
      start_time,
      end_time,
      is_available
    `
    )
    .eq('business_id', businessId)
    .is('branch_id', null)
    .is('staff_id', null)
    .order('day_of_week');

  if (error) {
    console.error('Error fetching public availability:', error);
    return [];
  }

  return data || [];
}

// ============================================
// GET CUSTOMER TRANSACTIONS
// ============================================

export interface PublicTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  description: string | null;
  created_at: string;
  reward_title: string | null;
}

export async function getCustomerTransactions(
  customerId: string,
  businessId: string,
  limit: number = 20
): Promise<PublicTransaction[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('transactions')
    .select(
      `
      id,
      type,
      points,
      description,
      created_at,
      rewards:reward_id (
        title
      )
    `
    )
    .eq('customer_id', customerId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching customer transactions:', error);
    return [];
  }

  return (data || []).map((tx) => {
    const reward = Array.isArray(tx.rewards) ? tx.rewards[0] : tx.rewards;
    return {
      id: tx.id,
      type: tx.type as PublicTransaction['type'],
      points: tx.points,
      description: tx.description,
      created_at: tx.created_at || '',
      reward_title: reward?.title || null,
    };
  });
}

// ============================================
// SELF-SIGNUP CUSTOMER
// ============================================

export interface SelfSignupResult {
  customerId: string;
  isNewCustomer: boolean;
  cardToken: string;
  qrCodeUrl: string;
  email: string | null;
}

// ============================================
// GET CUSTOMER BY PHONE
// ============================================

export interface CustomerByPhoneResult {
  id: string;
  fullName: string;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
}

export async function getCustomerByPhone(
  businessId: string,
  phone: string
): Promise<CustomerByPhoneResult | null> {
  const supabase = createServiceClient();
  const normalizedPhone = phone.replace(/\s+/g, '');

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, qr_code_url, tier, total_points')
    .eq('phone', normalizedPhone)
    .eq('created_by_business_id', businessId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name || '',
    qrCodeUrl: data.qr_code_url || '',
    tier: data.tier || 'bronze',
    totalPoints: data.total_points || 0,
  };
}

// ============================================
// SELF-SIGNUP CUSTOMER
// ============================================

export async function createSelfSignupCustomer(
  businessId: string,
  fullName: string,
  phone: string,
  email?: string
): Promise<SelfSignupResult> {
  const supabase = createServiceClient();

  // Normalize inputs
  const normalizedPhone = phone.replace(/\s+/g, '');
  const normalizedEmail = email?.toLowerCase().trim() || null;

  // Check for existing customer by phone (global) or email (global)
  // Phone has a global unique constraint, so we check globally
  let existingCustomer = null;

  // First check by phone globally (unique constraint is global, not per-business)
  const { data: byPhone } = await supabase
    .from('customers')
    .select('id, qr_code_url, card_token, email')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (byPhone) {
    existingCustomer = byPhone;
  }

  // If not found by phone and email provided, check by email globally
  if (!existingCustomer && normalizedEmail) {
    const { data: byEmail } = await supabase
      .from('customers')
      .select('id, qr_code_url, card_token, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (byEmail) {
      existingCustomer = byEmail;
    }
  }

  if (existingCustomer) {
    // Customer exists - ensure card_token exists
    let cardToken = existingCustomer.card_token;

    if (!cardToken) {
      cardToken = generateCardToken(existingCustomer.id);
      await supabase
        .from('customers')
        .update({
          card_token: cardToken,
          card_token_created_at: new Date().toISOString(),
        })
        .eq('id', existingCustomer.id);
    }

    // Update email if provided and customer doesn't have one
    if (normalizedEmail && !existingCustomer.email) {
      await supabase
        .from('customers')
        .update({ email: normalizedEmail })
        .eq('id', existingCustomer.id);
    }

    return {
      customerId: existingCustomer.id,
      isNewCustomer: false,
      cardToken,
      qrCodeUrl: existingCustomer.qr_code_url || '',
      email: normalizedEmail || existingCustomer.email,
    };
  }

  // Create new customer
  const qrToken = generateQRToken();
  const qrCodeUrl = generateQRCodeUrl(qrToken);

  const { data: newCustomer, error: createError } = await supabase
    .from('customers')
    .insert({
      user_id: null,
      email: normalizedEmail,
      full_name: fullName,
      phone: normalizedPhone,
      total_points: 0,
      lifetime_points: 0,
      tier: 'bronze',
      qr_code_url: qrCodeUrl,
      created_by_staff_id: null,
      created_by_business_id: businessId,
    })
    .select('id')
    .single();

  if (createError || !newCustomer) {
    console.error('Create self-signup customer error:', createError);
    throw new Error('Failed to create customer');
  }

  const cardToken = generateCardToken(newCustomer.id);

  // Update with card token
  await supabase
    .from('customers')
    .update({
      card_token: cardToken,
      card_token_created_at: new Date().toISOString(),
    })
    .eq('id', newCustomer.id);

  return {
    customerId: newCustomer.id,
    isNewCustomer: true,
    cardToken,
    qrCodeUrl,
    email: normalizedEmail,
  };
}
