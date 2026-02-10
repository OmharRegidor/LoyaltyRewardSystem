// src/lib/reward-utils.ts

import type { Reward, RewardCategory, TierLevel } from '../types/rewards.types';

// ============================================
// TYPES
// ============================================

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
}

export interface BusinessInfo {
  id: string;
  name: string;
  logo_url: string | null;
  branches?: Branch[];
}

export interface RewardFromSupabase {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  points_cost: number;
  stock: number | null;
  category: string | null;
  image_url: string | null;
  is_active: boolean | null;
  is_visible: boolean | null;
  tier_required: string | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string | null;
  businesses: BusinessInfo | BusinessInfo[] | null;
}

export interface RedeemResult {
  success: boolean;
  redemption_id?: string;
  redemption_code?: string;
  expires_at?: string;
  points_used?: number;
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

const VALID_CATEGORIES: readonly RewardCategory[] = [
  'all',
  'food',
  'drinks',
  'discounts',
  'free',
  'prods',
] as const;

const VALID_TIERS: readonly TierLevel[] = [
  'bronze',
  'silver',
  'gold',
  'platinum',
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function extractBusiness(
  businesses: BusinessInfo | BusinessInfo[] | null,
): BusinessInfo | undefined {
  if (!businesses) return undefined;
  if (Array.isArray(businesses)) return businesses[0] ?? undefined;
  return businesses;
}

export function isValidCategory(category: unknown): category is RewardCategory {
  return (
    typeof category === 'string' &&
    VALID_CATEGORIES.includes(category as RewardCategory)
  );
}

export function isValidTier(tier: unknown): tier is TierLevel {
  return typeof tier === 'string' && VALID_TIERS.includes(tier as TierLevel);
}

export function isWithinValidDateRange(
  validFrom: string | null,
  validUntil: string | null,
): boolean {
  const now = Date.now();
  if (validFrom && new Date(validFrom).getTime() > now) return false;
  if (validUntil && new Date(validUntil).getTime() < now) return false;
  return true;
}

export function transformToReward(raw: RewardFromSupabase): Reward | null {
  if (!isWithinValidDateRange(raw.valid_from, raw.valid_until)) {
    return null;
  }

  const business = extractBusiness(raw.businesses);
  const category = isValidCategory(raw.category) ? raw.category : 'all';
  const tierRequired = isValidTier(raw.tier_required)
    ? raw.tier_required
    : null;

  return {
    id: raw.id,
    business_id: raw.business_id,
    title: raw.title,
    description: raw.description,
    points_cost: raw.points_cost,
    stock: raw.stock ?? -1,
    category,
    image_url: raw.image_url,
    active: raw.is_active ?? false,
    created_at: raw.created_at ?? new Date().toISOString(),
    tier_required: tierRequired,
    business: business
      ? {
          id: business.id,
          name: business.name,
          logo_url: business.logo_url,
          branches: business.branches || [],
        }
      : undefined,
  };
}
