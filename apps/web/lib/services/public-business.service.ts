// apps/web/lib/services/public-business.service.ts

import { createServiceClient } from '@/lib/supabase-server';
import type { Database } from '../../../../packages/shared/types/database';
import {
  generateQRToken,
  generateQRCodeUrl,
  generateCardToken,
} from '@/lib/qr-code';

type Business = Database['public']['Tables']['businesses']['Row'];
type Reward = Database['public']['Tables']['rewards']['Row'];

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

export interface PublicReward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  category: string | null;
  image_url: string | null;
  stock: number | null;
}

// ============================================
// GET PUBLIC BUSINESSES (DIRECTORY)
// ============================================

interface GetPublicBusinessesParams {
  search?: string;
  businessType?: string;
  page?: number;
  limit?: number;
}

interface GetPublicBusinessesResult {
  businesses: PublicBusiness[];
  total: number;
}

export async function getPublicBusinesses(
  params: GetPublicBusinessesParams = {}
): Promise<GetPublicBusinessesResult> {
  const { search, businessType, page = 1, limit = 12 } = params;
  const supabase = createServiceClient();
  const offset = (page - 1) * limit;

  let query = supabase
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
      rewards!inner(id)
    `,
      { count: 'exact' }
    )
    .eq('rewards.is_active', true)
    .eq('rewards.is_visible', true)
    .in('subscription_status', ['active', 'trialing', 'free_forever', 'preview'])
    .order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (businessType) {
    query = query.eq('business_type', businessType);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching public businesses:', error);
    return { businesses: [], total: 0 };
  }

  const businesses: PublicBusiness[] = (data || []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    logo_url: b.logo_url,
    business_type: b.business_type,
    address: b.address,
    city: b.city,
    phone: b.phone,
    points_per_purchase: b.points_per_purchase,
    pesos_per_point: b.pesos_per_point,
  }));

  return { businesses, total: count ?? 0 };
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
    .in('subscription_status', ['active', 'trialing', 'free_forever', 'preview'])
    .maybeSingle();

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
// GET BUSINESS BY JOIN CODE
// ============================================

export async function getBusinessByJoinCode(
  joinCode: string,
): Promise<PublicBusiness | null> {
  const supabase = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
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
    `,
    )
    .eq('join_code', joinCode.toUpperCase())
    .in('subscription_status', ['active', 'trialing', 'free_forever', 'preview'])
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error('getBusinessByJoinCode error:', error.message, { joinCode });
    }
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
  email: string | null;
  phone: string | null;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
  pinHash: string | null;
  failedPinAttempts: number;
  pinLockedUntil: string | null;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***.com';
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function getCustomerByPhone(
  businessId: string,
  phone: string
): Promise<CustomerByPhoneResult | null> {
  const supabase = createServiceClient();
  const normalizedPhone = phone.replace(/\s+/g, '');

  // First check business-scoped customers
  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, email, phone, qr_code_url, tier, total_points, pin_hash, failed_pin_attempts, pin_locked_until')
    .eq('phone', normalizedPhone)
    .eq('created_by_business_id', businessId)
    .maybeSingle();

  if (!error && data) {
    return {
      id: data.id,
      fullName: data.full_name || '',
      email: data.email || null,
      phone: data.phone || null,
      qrCodeUrl: data.qr_code_url || '',
      tier: data.tier || 'bronze',
      totalPoints: data.total_points || 0,
      pinHash: data.pin_hash || null,
      failedPinAttempts: data.failed_pin_attempts || 0,
      pinLockedUntil: data.pin_locked_until || null,
    };
  }

  // Fallback: check customers linked to this business via customer_businesses
  const { data: linked } = await supabase
    .from('customer_businesses')
    .select('customers!inner(id, full_name, email, phone, qr_code_url, tier, total_points, pin_hash, failed_pin_attempts, pin_locked_until)')
    .eq('business_id', businessId);

  if (linked) {
    for (const link of linked) {
      const c = Array.isArray(link.customers) ? link.customers[0] : link.customers;
      if (!c) continue;
      if (c.phone && c.phone.replace(/\s+/g, '') === normalizedPhone) {
        return {
          id: c.id,
          fullName: c.full_name || '',
          email: c.email || null,
          phone: c.phone || null,
          qrCodeUrl: c.qr_code_url || '',
          tier: c.tier || 'bronze',
          totalPoints: c.total_points || 0,
          pinHash: c.pin_hash || null,
          failedPinAttempts: c.failed_pin_attempts || 0,
          pinLockedUntil: c.pin_locked_until || null,
        };
      }
    }
  }

  return null;
}

export async function getCustomerByEmail(
  businessId: string,
  email: string
): Promise<CustomerByPhoneResult | null> {
  const supabase = createServiceClient();
  const normalizedEmail = email.toLowerCase().trim();

  // First check business-scoped customers
  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, email, phone, qr_code_url, tier, total_points, pin_hash, failed_pin_attempts, pin_locked_until')
    .eq('email', normalizedEmail)
    .eq('created_by_business_id', businessId)
    .maybeSingle();

  if (!error && data) {
    return {
      id: data.id,
      fullName: data.full_name || '',
      email: data.email || null,
      phone: data.phone || null,
      qrCodeUrl: data.qr_code_url || '',
      tier: data.tier || 'bronze',
      totalPoints: data.total_points || 0,
      pinHash: data.pin_hash || null,
      failedPinAttempts: data.failed_pin_attempts || 0,
      pinLockedUntil: data.pin_locked_until || null,
    };
  }

  // Fallback: check customers linked to this business via customer_businesses
  const { data: linked } = await supabase
    .from('customer_businesses')
    .select('customers!inner(id, full_name, email, phone, qr_code_url, tier, total_points, pin_hash, failed_pin_attempts, pin_locked_until)')
    .eq('business_id', businessId);

  if (linked) {
    for (const link of linked) {
      const c = Array.isArray(link.customers) ? link.customers[0] : link.customers;
      if (!c) continue;
      if (c.email && c.email.toLowerCase() === normalizedEmail) {
        return {
          id: c.id,
          fullName: c.full_name || '',
          email: c.email || null,
          phone: c.phone || null,
          qrCodeUrl: c.qr_code_url || '',
          tier: c.tier || 'bronze',
          totalPoints: c.total_points || 0,
          pinHash: c.pin_hash || null,
          failedPinAttempts: c.failed_pin_attempts || 0,
          pinLockedUntil: c.pin_locked_until || null,
        };
      }
    }
  }

  return null;
}

// ============================================
// SELF-SIGNUP CUSTOMER
// ============================================

export async function createSelfSignupCustomer(
  businessId: string,
  fullName: string,
  phone: string | null | undefined,
  email?: string
): Promise<SelfSignupResult> {
  const supabase = createServiceClient();

  // Normalize inputs
  const normalizedPhone = phone ? phone.replace(/\s+/g, '') : null;
  const normalizedEmail = email?.toLowerCase().trim() || null;

  // Check for existing customer by phone (if provided) within this business
  let existingCustomer: { id: string; qr_code_url: string | null; card_token: string | null; email: string | null; phone: string | null } | null = null;
  if (normalizedPhone) {
    const { data } = await supabase
      .from('customers')
      .select('id, qr_code_url, card_token, email, phone')
      .eq('phone', normalizedPhone)
      .eq('created_by_business_id', businessId)
      .maybeSingle();
    existingCustomer = data;
  }

  // If no business-scoped match, search for customers already linked to this
  // business via customer_businesses (e.g. mobile-originated customers who
  // earned points but have created_by_business_id = NULL and may have
  // different email/phone than what was entered on the web form).
  if (!existingCustomer) {
    const { data: linkedCustomers } = await supabase
      .from('customer_businesses')
      .select('customer_id, customers!inner(id, qr_code_url, card_token, email, phone)')
      .eq('business_id', businessId);

    if (linkedCustomers && linkedCustomers.length > 0) {
      for (const link of linkedCustomers) {
        const c = Array.isArray(link.customers) ? link.customers[0] : link.customers;
        if (!c) continue;
        const emailMatch = normalizedEmail && c.email && c.email.toLowerCase() === normalizedEmail;
        const phoneMatch = normalizedPhone && c.phone && c.phone.replace(/\s+/g, '') === normalizedPhone;
        if (emailMatch || phoneMatch) {
          existingCustomer = { id: c.id, qr_code_url: c.qr_code_url, card_token: c.card_token, email: c.email, phone: c.phone };
          break;
        }
      }
    }
  }

  // Fallback: search globally for mobile-created customers by email/phone
  if (!existingCustomer) {
    if (normalizedEmail) {
      const { data } = await supabase
        .from('customers')
        .select('id, qr_code_url, card_token, email, phone')
        .eq('email', normalizedEmail)
        .not('user_id', 'is', null)
        .maybeSingle();
      if (data) existingCustomer = data;
    }
    if (!existingCustomer && normalizedPhone) {
      const { data } = await supabase
        .from('customers')
        .select('id, qr_code_url, card_token, email, phone')
        .eq('phone', normalizedPhone)
        .not('user_id', 'is', null)
        .maybeSingle();
      if (data) existingCustomer = data;
    }
  }

  if (existingCustomer) {
    // Customer exists - ensure card_token exists
    let cardToken = existingCustomer.card_token;

    if (!cardToken) {
      try {
        cardToken = generateCardToken(existingCustomer.id);
        await supabase
          .from('customers')
          .update({
            card_token: cardToken,
            card_token_created_at: new Date().toISOString(),
          })
          .eq('id', existingCustomer.id);
      } catch (tokenErr) {
        console.error('Failed to generate card token for existing customer:', existingCustomer.id, tokenErr);
        cardToken = '';
      }
    }

    // Update email if provided and customer doesn't have one
    if (normalizedEmail && !existingCustomer.email) {
      await supabase
        .from('customers')
        .update({ email: normalizedEmail })
        .eq('id', existingCustomer.id);
    }

    // Update phone if provided and customer doesn't have one
    if (normalizedPhone && !existingCustomer.phone) {
      await supabase
        .from('customers')
        .update({ phone: normalizedPhone })
        .eq('id', existingCustomer.id);
    }

    // Link customer to business
    await supabase
      .from('customer_businesses')
      .upsert(
        { customer_id: existingCustomer.id, business_id: businessId },
        { onConflict: 'customer_id,business_id' },
      );

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
      phone: normalizedPhone || null,
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
    // INSERT failed — re-check for existing customer (concurrent insert race)
    let raceQuery = supabase
      .from('customers')
      .select('id, qr_code_url, card_token, email')
      .eq('created_by_business_id', businessId);

    if (normalizedPhone) {
      raceQuery = raceQuery.eq('phone', normalizedPhone);
    } else if (normalizedEmail) {
      raceQuery = raceQuery.eq('email', normalizedEmail);
    }

    const { data: existing } = await raceQuery.maybeSingle();

    if (!existing) {
      console.error('Create self-signup customer error:', createError);
      throw new Error('Failed to create customer');
    }

    let fallbackCardToken = existing.card_token;
    if (!fallbackCardToken) {
      try {
        fallbackCardToken = generateCardToken(existing.id);
        await supabase
          .from('customers')
          .update({ card_token: fallbackCardToken, card_token_created_at: new Date().toISOString() })
          .eq('id', existing.id);
      } catch (tokenErr) {
        console.error('Failed to generate card token for race-condition customer:', existing.id, tokenErr);
        fallbackCardToken = '';
      }
    }

    // Link customer to business (race-condition path)
    await supabase
      .from('customer_businesses')
      .upsert(
        { customer_id: existing.id, business_id: businessId },
        { onConflict: 'customer_id,business_id' },
      );

    return {
      customerId: existing.id,
      isNewCustomer: false,
      cardToken: fallbackCardToken,
      qrCodeUrl: existing.qr_code_url || '',
      email: normalizedEmail || existing.email,
    };
  }

  let cardToken = '';
  try {
    cardToken = generateCardToken(newCustomer.id);
    await supabase
      .from('customers')
      .update({
        card_token: cardToken,
        card_token_created_at: new Date().toISOString(),
      })
      .eq('id', newCustomer.id);
  } catch (tokenErr) {
    console.error('Failed to generate card token for new customer:', newCustomer.id, tokenErr);
  }

  // Link new customer to business
  await supabase
    .from('customer_businesses')
    .upsert(
      { customer_id: newCustomer.id, business_id: businessId },
      { onConflict: 'customer_id,business_id' },
    );

  return {
    customerId: newCustomer.id,
    isNewCustomer: true,
    cardToken,
    qrCodeUrl,
    email: normalizedEmail,
  };
}
