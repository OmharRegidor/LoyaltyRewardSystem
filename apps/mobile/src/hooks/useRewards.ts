// apps/mobile/src/hooks/useRewards.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCustomer } from './useCustomer';
import type { Reward, RewardCategory } from '../types/rewards.types';

// ============================================
// TYPES
// ============================================

interface BusinessInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

/**
 * Raw reward data from Supabase query
 * Using explicit types instead of 'any'
 */
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
  discount_type: string | null;
  discount_value: number | null;
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

interface UseRewardsReturn {
  rewards: Reward[];
  allRewards: Reward[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  activeCategory: RewardCategory;
  setActiveCategory: (category: RewardCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refresh: () => Promise<void>;
  canRedeem: (reward: Reward) => boolean;
  pointsNeeded: (reward: Reward) => number;
  redeemReward: (reward: Reward) => Promise<{
    id: string | undefined;
    customer_id: string;
    reward_id: string;
    business_id: string;
    points_used: number | undefined;
    redemption_code: string | undefined;
    status: 'pending';
    expires_at: string | undefined;
    completed_at: null;
    created_at: string;
  }>;
  redeemingId: string | null;
  userPoints: number;
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

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely extracts BusinessInfo from Supabase's response
 * Handles both array and single object responses from foreign key joins
 */
function extractBusiness(
  businesses: BusinessInfo | BusinessInfo[] | null
): BusinessInfo | undefined {
  if (!businesses) return undefined;
  if (Array.isArray(businesses)) return businesses[0] ?? undefined;
  return businesses;
}

/**
 * Type guard for valid reward categories
 */
function isValidCategory(category: unknown): category is RewardCategory {
  return (
    typeof category === 'string' &&
    VALID_CATEGORIES.includes(category as RewardCategory)
  );
}

/**
 * Validates if reward is within valid date range
 */
function isWithinValidDateRange(
  validFrom: string | null,
  validUntil: string | null
): boolean {
  const now = Date.now();

  if (validFrom && new Date(validFrom).getTime() > now) {
    return false;
  }

  if (validUntil && new Date(validUntil).getTime() < now) {
    return false;
  }

  return true;
}

/**
 * Transforms raw Supabase data to app Reward type
 * Returns null if reward is invalid (expired, etc.)
 */
function transformToReward(raw: RewardFromSupabase): Reward | null {
  // Skip rewards outside valid date range
  if (!isWithinValidDateRange(raw.valid_from, raw.valid_until)) {
    return null;
  }

  const business = extractBusiness(raw.businesses);
  const category = isValidCategory(raw.category) ? raw.category : 'all';

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

export function useRewards(): UseRewardsReturn {
  const { customer, points, refreshCustomer } = useCustomer();

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

      // Debug: Check auth state
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('[useRewards] Auth session exists:', !!sessionData?.session);
      console.log(
        '[useRewards] User ID:',
        sessionData?.session?.user?.id ?? 'none'
      );

      // Simplified query - fetch rewards directly without complex joins first
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
          discount_type,
          discount_value,
          valid_from,
          valid_until,
          created_at,
          businesses (
            id,
            name,
            logo_url
          )
        `
        )
        .eq('is_active', true)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      // Debug: Log raw response
      console.log('[useRewards] Fetch error:', fetchError?.message ?? 'none');
      console.log('[useRewards] Raw data count:', data?.length ?? 0);
      console.log('[useRewards] Raw data:', JSON.stringify(data, null, 2));

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!data || data.length === 0) {
        console.log('[useRewards] No rewards returned from database');
        setRewards([]);
        return;
      }

      // Transform data with type safety
      const transformedRewards = (data as RewardFromSupabase[])
        .map(transformToReward)
        .filter((reward): reward is Reward => reward !== null);

      console.log(
        '[useRewards] Transformed rewards count:',
        transformedRewards.length
      );

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

    // Real-time subscription for rewards changes
    const channel = supabase
      .channel('rewards_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rewards',
        },
        (payload) => {
          console.log('[useRewards] Realtime update:', payload.eventType);
          fetchRewards();
        }
      )
      .subscribe((status) => {
        console.log('[useRewards] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRewards]);

  // ============================================
  // REFRESH HANDLER
  // ============================================

  const refresh = useCallback(async (): Promise<void> => {
    console.log('[useRewards] Manual refresh triggered');
    setIsRefreshing(true);
    await fetchRewards();
  }, [fetchRewards]);

  // ============================================
  // FILTERED REWARDS (Memoized)
  // ============================================

  const filteredRewards = useMemo((): Reward[] => {
    let result = rewards;

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter((reward) => reward.category === activeCategory);
    }

    // Filter by search query
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      result = result.filter((reward) => {
        const titleMatch = reward.title.toLowerCase().includes(trimmedQuery);
        const descMatch =
          reward.description?.toLowerCase().includes(trimmedQuery) ?? false;
        const businessMatch =
          reward.business?.name.toLowerCase().includes(trimmedQuery) ?? false;
        return titleMatch || descMatch || businessMatch;
      });
    }

    return result;
  }, [rewards, activeCategory, searchQuery]);

  // ============================================
  // REDEMPTION HELPERS
  // ============================================

  const canRedeem = useCallback(
    (reward: Reward): boolean => {
      const hasEnoughPoints = points >= reward.points_cost;
      const inStock = reward.stock === -1 || reward.stock > 0;
      return hasEnoughPoints && inStock;
    },
    [points]
  );

  const pointsNeeded = useCallback(
    (reward: Reward): number => {
      return Math.max(0, reward.points_cost - points);
    },
    [points]
  );

  // ============================================
  // REDEEM REWARD
  // ============================================

  const redeemReward = useCallback(
    async (reward: Reward) => {
      if (!customer) {
        throw new Error('Not logged in');
      }

      if (!canRedeem(reward)) {
        throw new Error('Cannot redeem this reward');
      }

      try {
        setRedeemingId(reward.id);

        const { data, error: redeemError } = await supabase.rpc(
          'redeem_reward',
          {
            p_customer_id: customer.id,
            p_reward_id: reward.id,
          }
        );

        if (redeemError) {
          throw new Error(redeemError.message);
        }

        const result = data as RedeemResult;

        if (!result.success) {
          throw new Error(result.error ?? 'Redemption failed');
        }

        // Refresh data
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
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Redemption failed';
        console.error('[useRewards] Redeem error:', errorMessage);
        throw new Error(errorMessage);
      } finally {
        setRedeemingId(null);
      }
    },
    [customer, canRedeem, refreshCustomer, fetchRewards]
  );

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
    pointsNeeded,
    redeemReward,
    redeemingId,
    userPoints: points,
  };
}
