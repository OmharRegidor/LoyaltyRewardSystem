// src/hooks/useRewards.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { rewardsService } from '../services/rewards.service';
import { useCustomer } from './useCustomer';
import type { Reward, RewardCategory } from '../types/rewards.types';

// Mock data for development
const MOCK_REWARDS: Reward[] = [
  {
    id: '1',
    business_id: 'b1',
    title: 'Free Coffee & Pastry',
    description:
      'Enjoy a complimentary coffee of your choice with a freshly baked pastry. Perfect for your morning routine.',
    points_cost: 500,
    stock: 20,
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    active: true,
    created_at: new Date().toISOString(),
    category: 'food',
    business: {
      id: 'b1',
      name: 'Bean & Brew Cafe',
      logo_url: null,
    },
  },
  {
    id: '2',
    business_id: 'b2',
    title: '20% Off Next Order',
    description:
      'Get 20% off your entire order at Downtown Bistro. Valid for dine-in and takeout orders.',
    points_cost: 750,
    stock: 3,
    image_url:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    active: true,
    created_at: new Date().toISOString(),
    category: 'discounts',
    business: {
      id: 'b2',
      name: 'Downtown Bistro',
      logo_url: null,
    },
  },
  {
    id: '3',
    business_id: 'b3',
    title: 'Dozen Donuts Box',
    description:
      'Redeem a full dozen of our signature donuts. Mix and match your favorite flavors.',
    points_cost: 1200,
    stock: 15,
    image_url:
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop',
    active: true,
    created_at: new Date().toISOString(),
    category: 'food',
    business: {
      id: 'b3',
      name: 'Sweet Delights',
      logo_url: null,
    },
  },
  {
    id: '4',
    business_id: 'b4',
    title: '2-for-1 Happy Hour',
    description:
      'Buy one cocktail, get one free during happy hour. Valid Monday through Thursday, 4-7pm.',
    points_cost: 600,
    stock: 25,
    image_url:
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop',
    active: true,
    created_at: new Date().toISOString(),
    category: 'drinks',
    business: {
      id: 'b4',
      name: 'The Sunset Lounge',
      logo_url: null,
    },
  },
  {
    id: '5',
    business_id: 'b5',
    title: 'Beauty Bundle Pack',
    description:
      'Premium beauty bundle including skincare essentials and makeup products worth $50.',
    points_cost: 1500,
    stock: 2,
    image_url:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    active: true,
    created_at: new Date().toISOString(),
    category: 'free',
    business: {
      id: 'b5',
      name: 'Glow Beauty Store',
      logo_url: null,
    },
  },
];

// Set to true to use mock data, false to use real API
const USE_MOCK_DATA = true;

export function useRewards() {
  const { customer, points, refreshCustomer } = useCustomer();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeCategory, setActiveCategory] = useState<RewardCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Fetch rewards
  const fetchRewards = useCallback(async () => {
    try {
      setError(null);

      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setRewards(MOCK_REWARDS);
      } else {
        const data = await rewardsService.getAll();
        setRewards(data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch rewards')
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // Refresh handler
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchRewards();
  }, [fetchRewards]);

  // Filter rewards by category and search
  const filteredRewards = useMemo(() => {
    let filtered = rewards;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter((r) => r.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.business?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [rewards, activeCategory, searchQuery]);

  // Check if user can redeem a reward
  const canRedeem = useCallback(
    (reward: Reward): boolean => {
      return points >= reward.points_cost && reward.stock > 0;
    },
    [points]
  );

  // Get points needed for a reward
  const pointsNeeded = useCallback(
    (reward: Reward): number => {
      return Math.max(0, reward.points_cost - points);
    },
    [points]
  );

  // Redeem a reward
  const redeemReward = useCallback(
    async (reward: Reward) => {
      if (!customer) throw new Error('Not logged in');
      if (!canRedeem(reward)) throw new Error('Cannot redeem this reward');

      try {
        setRedeemingId(reward.id);

        if (USE_MOCK_DATA) {
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return {
            id: 'mock-redemption',
            customer_id: customer.id,
            reward_id: reward.id,
            business_id: reward.business_id,
            points_used: reward.points_cost,
            redemption_code: `RDM-${Math.random()
              .toString(36)
              .substring(2, 10)
              .toUpperCase()}`,
            status: 'pending' as const,
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
            completed_at: null,
            created_at: new Date().toISOString(),
          };
        }

        const redemption = await rewardsService.redeem({
          customerId: customer.id,
          rewardId: reward.id,
          businessId: reward.business_id,
          pointsCost: reward.points_cost,
        });

        await refreshCustomer();
        await fetchRewards();

        return redemption;
      } finally {
        setRedeemingId(null);
      }
    },
    [customer, canRedeem, refreshCustomer, fetchRewards]
  );

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
