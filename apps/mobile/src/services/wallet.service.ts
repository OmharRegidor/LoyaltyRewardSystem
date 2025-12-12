// src/services/wallet.service.ts

import { supabase } from '../lib/supabase';
import type { Transaction, CustomerRedemption } from '../types/wallet.types';

export const walletService = {
  /**
   * Get all transactions for a customer
   */
  async getTransactions(customerId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        business:businesses(id, name, logo_url)
      `
      )
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get customer redemptions (My Rewards)
   */
  async getRedemptions(customerId: string): Promise<CustomerRedemption[]> {
    const { data, error } = await supabase
      .from('redemptions')
      .select(
        `
        *,
        reward:rewards(id, title, description, image_url, points_cost),
        business:businesses(id, name, logo_url)
      `
      )
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching redemptions:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get lifetime points earned
   */
  async getLifetimePoints(customerId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_customer_lifetime_points', {
      p_customer_id: customerId,
    });

    if (error) {
      console.error('Error fetching lifetime points:', error);
      return 0;
    }

    return data || 0;
  },
};
