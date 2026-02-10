// src/hooks/useBrandRewards.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCustomer } from './useCustomer';
import type { Reward, TierLevel } from '../types/rewards.types';
import { canAccessReward } from '../types/rewards.types';
import type { BrandBranch } from '../types/brands.types';
import {
  transformToReward,
  isValidTier,
  type RewardFromSupabase,
  type RedeemResult,
} from '../lib/reward-utils';

interface BrandDetail {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  points_per_purchase: number | null;
  branches: BrandBranch[];
}

export function useBrandRewards(businessId: string) {
  const { customer, points, tier, refreshCustomer } = useCustomer();
  const userTier = (isValidTier(tier) ? tier : 'bronze') as TierLevel;

  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const fetchBrandData = useCallback(async (): Promise<void> => {
    try {
      const [brandResult, rewardsResult] = await Promise.all([
        supabase
          .from('businesses')
          .select(
            `
            id,
            name,
            logo_url,
            description,
            points_per_purchase,
            branches (id, name, address, city, phone, is_active)
          `,
          )
          .eq('id', businessId)
          .single(),
        supabase
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
            businesses (id, name, logo_url, branches (id, name, address, city))
          `,
          )
          .eq('business_id', businessId)
          .eq('is_active', true)
          .eq('is_visible', true)
          .order('points_cost', { ascending: true }),
      ]);

      if (brandResult.error) throw new Error(brandResult.error.message);
      if (rewardsResult.error) throw new Error(rewardsResult.error.message);

      const brandData = brandResult.data as BrandDetail & {
        branches: BrandBranch[];
      };
      setBrand({
        id: brandData.id,
        name: brandData.name,
        logo_url: brandData.logo_url,
        description: brandData.description,
        points_per_purchase: brandData.points_per_purchase,
        branches: (brandData.branches || []).filter((b) => b.is_active),
      });

      const transformedRewards = (rewardsResult.data as RewardFromSupabase[])
        .map(transformToReward)
        .filter((r): r is Reward => r !== null);

      setRewards(transformedRewards);
    } catch (err) {
      console.error('[useBrandRewards] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchBrandData();

    const channel = supabase
      .channel(`brand_rewards_${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rewards',
          filter: `business_id=eq.${businessId}`,
        },
        () => fetchBrandData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBrandData, businessId]);

  const canRedeem = useCallback(
    (reward: Reward): boolean => {
      const hasPoints = points >= reward.points_cost;
      const inStock = reward.stock === -1 || reward.stock > 0;
      const hasTier = canAccessReward(userTier, reward.tier_required);
      return hasPoints && inStock && hasTier;
    },
    [points, userTier],
  );

  const isLocked = useCallback(
    (reward: Reward): boolean => {
      return !canAccessReward(userTier, reward.tier_required);
    },
    [userTier],
  );

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
          },
        );

        if (redeemError) throw new Error(redeemError.message);

        const result = data as RedeemResult;
        if (!result.success)
          throw new Error(result.error ?? 'Redemption failed');

        await Promise.all([refreshCustomer(), fetchBrandData()]);

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
    [customer, canRedeem, refreshCustomer, fetchBrandData],
  );

  const refresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    await fetchBrandData();
  }, [fetchBrandData]);

  return {
    brand,
    rewards,
    isLoading,
    isRefreshing,
    redeemReward,
    redeemingId,
    canRedeem,
    isLocked,
    userPoints: points,
    userTier,
    refresh,
  };
}
