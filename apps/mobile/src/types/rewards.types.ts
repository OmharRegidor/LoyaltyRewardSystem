// src/types/rewards.types.ts

// ============================================
// TIER TYPES
// ============================================

export type TierLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export const TIER_ORDER: Record<TierLevel, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
} as const;

// ============================================
// REWARD TYPES
// ============================================

export interface Reward {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  points_cost: number;
  stock: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
  category: RewardCategory;
  tier_required: TierLevel | null;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    branches?: {
      id: string;
      name: string;
      address: string | null;
      city: string | null;
    }[];
  };
}

export type RewardCategory =
  | 'all'
  | 'food'
  | 'drinks'
  | 'discounts'
  | 'free'
  | 'prods';

export interface RewardFilter {
  category: RewardCategory;
  searchQuery: string;
}

// ============================================
// REDEMPTION TYPES
// ============================================

export interface Redemption {
  id: string;
  customer_id: string;
  reward_id: string;
  business_id: string;
  points_used: number;
  redemption_code: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  completed_at: string | null;
  created_at: string;
}

// ============================================
// TIER HELPER FUNCTIONS
// ============================================

/**
 * Check if user's tier meets reward requirement
 */
export function canAccessReward(
  userTier: TierLevel,
  requiredTier: TierLevel | null,
): boolean {
  if (!requiredTier) return true;
  return TIER_ORDER[userTier] >= TIER_ORDER[requiredTier];
}

/**
 * Get tier display info (name, color, emoji)
 */
export function getTierInfo(tier: TierLevel): {
  name: string;
  color: string;
  emoji: string;
} {
  const info: Record<
    TierLevel,
    { name: string; color: string; emoji: string }
  > = {
    bronze: { name: 'Bronze', color: '#CD7F32', emoji: '🥉' },
    silver: { name: 'Silver', color: '#C0C0C0', emoji: '🥈' },
    gold: { name: 'Gold', color: '#FFD700', emoji: '🥇' },
    platinum: { name: 'Platinum', color: '#E5E4E2', emoji: '💎' },
  };
  return info[tier];
}
