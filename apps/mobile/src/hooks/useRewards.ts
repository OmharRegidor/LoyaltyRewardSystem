// src/hooks/useRewards.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCustomer } from './useCustomer';
import type { Reward, RewardCategory, TierLevel } from '../types/rewards.types';
import { canAccessReward, TIER_ORDER } from '../types/rewards.types';

// ============================================
// TYPES
// ============================================

interface BusinessInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

interface RewardFromSupabase {
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

interface RedeemResult {
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

function extractBusiness(
  businesses: BusinessInfo | BusinessInfo[] | null
): BusinessInfo | undefined {
  if (!businesses) return undefined;
  if (Array.isArray(businesses)) return businesses[0] ?? undefined;
  return businesses;
}

function isValidCategory(category: unknown): category is RewardCategory {
  return (
    typeof category === 'string' &&
    VALID_CATEGORIES.includes(category as RewardCategory)
  );
}

function isValidTier(tier: unknown): tier is TierLevel {
  return typeof tier === 'string' && VALID_TIERS.includes(tier as TierLevel);
}

function isWithinValidDateRange(
  validFrom: string | null,
  validUntil: string | null
): boolean {
  const now = Date.now();
  if (validFrom && new Date(validFrom).getTime() > now) return false;
  if (validUntil && new Date(validUntil).getTime() < now) return false;
  return true;
}

function transformToReward(raw: RewardFromSupabase): Reward | null {
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
        }
      : undefined,
  };
}

// ============================================
// HOOK
// ============================================

export function useRewards() {
  const { customer, points, tier, refreshCustomer } = useCustomer();
  const userTier = (isValidTier(tier) ? tier : 'bronze') as TierLevel;

  // State
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeCategory, setActiveCategory] = useState<RewardCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // ============================================
  // FETCH REWARDS
  // ============================================

  const fetchRewards = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('rewards')
        .select(
          `
          id,
          business_id,
          title,
          description,
          points_cost,
          stock,
          category,
          image_url,
          is_active,
          is_visible,
          tier_required,
          valid_from,
          valid_until,
          created_at,
          businesses (id, name, logo_url)
        `
        )
        .eq('is_active', true)
        .eq('is_visible', true)
        .order('points_cost', { ascending: true });

      if (fetchError) throw new Error(fetchError.message);

      const transformedRewards = (data as RewardFromSupabase[])
        .map(transformToReward)
        .filter((reward): reward is Reward => reward !== null);

      setRewards(transformedRewards);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch rewards';
      console.error('[useRewards] Fetch error:', errorMessage);
      setError(new Error(errorMessage));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    fetchRewards();

    const channel = supabase
      .channel('rewards_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rewards' },
        () => fetchRewards()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRewards]);

  // ============================================
  // FILTERED & SORTED REWARDS
  // ============================================

  const filteredRewards = useMemo((): Reward[] => {
    let result = rewards;

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter((r) => r.category === activeCategory);
    }

    // Filter by search
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((r) => {
        const titleMatch = r.title.toLowerCase().includes(query);
        const descMatch = r.description?.toLowerCase().includes(query) ?? false;
        const bizMatch =
          r.business?.name.toLowerCase().includes(query) ?? false;
        return titleMatch || descMatch || bizMatch;
      });
    }

    // Sort: Accessible rewards first, then by points cost
    return result.sort((a, b) => {
      const aAccessible = canAccessReward(userTier, a.tier_required);
      const bAccessible = canAccessReward(userTier, b.tier_required);

      if (aAccessible && !bAccessible) return -1;
      if (!aAccessible && bAccessible) return 1;
      return a.points_cost - b.points_cost;
    });
  }, [rewards, activeCategory, searchQuery, userTier]);

  // ============================================
  // REDEMPTION HELPERS
  // ============================================

  const canRedeem = useCallback(
    (reward: Reward): boolean => {
      const hasPoints = points >= reward.points_cost;
      const inStock = reward.stock === -1 || reward.stock > 0;
      const hasTier = canAccessReward(userTier, reward.tier_required);
      return hasPoints && inStock && hasTier;
    },
    [points, userTier]
  );

  const isLocked = useCallback(
    (reward: Reward): boolean => {
      return !canAccessReward(userTier, reward.tier_required);
    },
    [userTier]
  );

  const pointsNeeded = useCallback(
    (reward: Reward): number => Math.max(0, reward.points_cost - points),
    [points]
  );

  // ============================================
  // REDEEM REWARD
  // ============================================

  const redeemReward = useCallback(
    async (reward: Reward) => {
      if (!customer) throw new Error('Not logged in');
      if (!canRedeem(reward)) throw new Error('Cannot redeem this reward');

      try {
        setRedeemingId(reward.id);

        const { data, error: redeemError } = await supabase.rpc(
          'redeem_reward',
          {
            p_customer_id: customer.id,
            p_reward_id: reward.id,
          }
        );

        if (redeemError) throw new Error(redeemError.message);

        const result = data as RedeemResult;
        if (!result.success)
          throw new Error(result.error ?? 'Redemption failed');

        await Promise.all([refreshCustomer(), fetchRewards()]);

        return {
          id: result.redemption_id,
          customer_id: customer.id,
          reward_id: reward.id,
          business_id: reward.business_id,
          points_used: result.points_used,
          redemption_code: result.redemption_code,
          status: 'pending' as const,
          expires_at: result.expires_at,
          completed_at: null,
          created_at: new Date().toISOString(),
        };
      } finally {
        setRedeemingId(null);
      }
    },
    [customer, canRedeem, refreshCustomer, fetchRewards]
  );

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    await fetchRewards();
  }, [fetchRewards]);

  // ============================================
  // RETURN
  // ============================================

  return {
    rewards: filteredRewards,
    allRewards: rewards,
    isLoading,
    isRefreshing,
    error,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    refresh,
    canRedeem,
    isLocked,
    pointsNeeded,
    redeemReward,
    redeemingId,
    userPoints: points,
    userTier,
  };
}
