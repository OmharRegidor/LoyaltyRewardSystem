// apps/web/lib/services/public-business.service.ts

import { createServiceClient } from '@/lib/supabase-server';
import type { Database } from '../../../../packages/shared/types/database';

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
