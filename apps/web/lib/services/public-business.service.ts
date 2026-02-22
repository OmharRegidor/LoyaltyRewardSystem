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

export interface PublicPriceVariant {
  id: string;
  name: string;
  price_centavos: number;
  description: string | null;
  capacity: number | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_centavos: number | null;
  pricing_type: string | null;
  config: Record<string, unknown> | null;
  price_variants: PublicPriceVariant[];
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

export interface PublicAddonOption {
  id: string;
  name: string;
  price_centavos: number;
  description: string | null;
}

export interface PublicAddon {
  id: string;
  name: string;
  description: string | null;
  price_centavos: number;
  duration_minutes: number | null;
  category: string | null;
  options: PublicAddonOption[];
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
      pesos_per_point
    `,
      { count: 'exact' }
    )
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
      price_centavos,
      pricing_type,
      config
    `
    )
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching public services:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Fetch price variants for all services
  const serviceIds = data.map((s) => s.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: variants } = await (supabase as any)
    .from('service_price_variants')
    .select('id, service_id, name, price_centavos, description, capacity')
    .in('service_id', serviceIds)
    .eq('is_active', true)
    .order('sort_order');

  // Group variants by service_id
  const variantsByService = new Map<string, PublicPriceVariant[]>();
  for (const variant of variants || []) {
    const serviceId = variant.service_id;
    if (!variantsByService.has(serviceId)) {
      variantsByService.set(serviceId, []);
    }
    variantsByService.get(serviceId)!.push({
      id: variant.id,
      name: variant.name,
      price_centavos: variant.price_centavos,
      description: variant.description,
      capacity: variant.capacity,
    });
  }

  return data.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    duration_minutes: service.duration_minutes,
    price_centavos: service.price_centavos,
    pricing_type: (service as Record<string, unknown>).pricing_type as string | null,
    config: (service as Record<string, unknown>).config as Record<string, unknown> | null,
    price_variants: variantsByService.get(service.id) || [],
  }));
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
// GET PUBLIC ADDONS
// ============================================

export async function getPublicAddons(
  businessId: string
): Promise<PublicAddon[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('booking_addons')
    .select(
      `
      id,
      name,
      description,
      price_centavos,
      duration_minutes,
      category
    `
    )
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  if (error) {
    console.error('Error fetching public addons:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Fetch addon options for all addons
  const addonIds = data.map((a) => a.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: options } = await (supabase as any)
    .from('booking_addon_options')
    .select('id, addon_id, name, price_centavos, description')
    .in('addon_id', addonIds)
    .eq('is_active', true)
    .order('sort_order');

  // Group options by addon_id
  const optionsByAddon = new Map<string, PublicAddonOption[]>();
  for (const option of options || []) {
    const addonId = option.addon_id;
    if (!optionsByAddon.has(addonId)) {
      optionsByAddon.set(addonId, []);
    }
    optionsByAddon.get(addonId)!.push({
      id: option.id,
      name: option.name,
      price_centavos: option.price_centavos,
      description: option.description,
    });
  }

  return data.map((addon) => ({
    id: addon.id,
    name: addon.name,
    description: addon.description,
    price_centavos: addon.price_centavos,
    duration_minutes: addon.duration_minutes,
    category: addon.category,
    options: optionsByAddon.get(addon.id) || [],
  }));
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
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
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

  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, email, qr_code_url, tier, total_points')
    .eq('phone', normalizedPhone)
    .eq('created_by_business_id', businessId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name || '',
    email: data.email || null,
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

  // Check for existing customer by phone within this business
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, qr_code_url, card_token, email')
    .eq('phone', normalizedPhone)
    .eq('created_by_business_id', businessId)
    .maybeSingle();

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
    // INSERT failed — re-check for existing customer (concurrent insert race)
    const { data: existing } = await supabase
      .from('customers')
      .select('id, qr_code_url, card_token, email')
      .eq('phone', normalizedPhone)
      .eq('created_by_business_id', businessId)
      .maybeSingle();

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
