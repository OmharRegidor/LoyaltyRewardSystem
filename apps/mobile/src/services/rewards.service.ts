// src/services/rewards.service.ts

import { supabase } from '../lib/supabase';
import type { Reward, Redemption, RewardCategory } from '../types/rewards.types';
import { nanoid } from 'nanoid/non-secure';

export const rewardsService = {
  /**
   * Fetch all active rewards with business info
   */
  async getAll(): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select(`
        *,
        business:businesses(id, name, logo_url)
      `)
      .eq('active', true)
      .gt('stock', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Fetch rewards by category
   */
  async getByCategory(category: RewardCategory): Promise<Reward[]> {
    if (category === 'all') {
      return this.getAll();
    }

    const { data, error } = await supabase
      .from('rewards')
      .select(`
        *,
        business:businesses(id, name, logo_url)
      `)
      .eq('active', true)
      .eq('category', category)
      .gt('stock', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Search rewards by title or description
   */
  async search(query: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select(`
        *,
        business:businesses(id, name, logo_url)
      `)
      .eq('active', true)
      .gt('stock', 0)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single reward by ID
   */
  async getById(id: string): Promise<Reward | null> {
    const { data, error } = await supabase
      .from('rewards')
      .select(`
        *,
        business:businesses(id, name, logo_url)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Redeem a reward
   */
  async redeem(params: {
    customerId: string;
    rewardId: string;
    businessId: string;
    pointsCost: number;
  }): Promise<Redemption> {
    const { customerId, rewardId, businessId, pointsCost } = params;

    // Generate unique redemption code
    const redemptionCode = `RDM-${nanoid(8).toUpperCase()}`;
    
    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Start transaction-like operations
    // 1. Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        customer_id: customerId,
        reward_id: rewardId,
        business_id: businessId,
        points_used: pointsCost,
        redemption_code: redemptionCode,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (redemptionError) throw redemptionError;

    // 2. Deduct points from customer (global balance)
    const { error: pointsError } = await supabase.rpc('deduct_customer_points', {
      p_customer_id: customerId,
      p_points: pointsCost,
    });

    if (pointsError) {
      // Rollback: Delete the redemption if points deduction fails
      await supabase.from('redemptions').delete().eq('id', redemption.id);
      throw pointsError;
    }

    // 2b. Deduct from per-business balance
    const { error: bizPointsError } = await supabase.rpc('deduct_business_points', {
      p_customer_id: customerId,
      p_business_id: businessId,
      p_points: pointsCost,
    });

    if (bizPointsError) {
      console.error('Per-business points deduction error:', bizPointsError);
    }

    // 3. Decrease reward stock
    const { error: stockError } = await supabase.rpc('decrease_reward_stock', {
      p_reward_id: rewardId,
    });

    if (stockError) {
      console.error('Stock decrease error:', stockError);
      // Non-critical, don't rollback
    }

    return redemption;
  },

  /**
   * Get customer's redemption history
   */
  async getRedemptionHistory(customerId: string): Promise<Redemption[]> {
    const { data, error } = await supabase
      .from('redemptions')
      .select(`
        *,
        reward:rewards(id, title, image_url, points_cost),
        business:businesses(id, name, logo_url)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};