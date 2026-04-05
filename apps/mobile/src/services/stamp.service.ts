// src/services/stamp.service.ts

import { supabase } from '../lib/supabase';
import type { StampCard } from '../types/stamp.types';

export const stampService = {
  /**
   * Get all active (non-redeemed) stamp cards for a customer across all businesses
   */
  async getStampCards(customerIds: string[]): Promise<StampCard[]> {
    if (customerIds.length === 0) return [];

    const results = await Promise.all(
      customerIds.map((customerId) =>
        supabase.rpc('get_customer_stamp_cards', { p_customer_id: customerId })
      ),
    );

    const allCards: StampCard[] = [];
    for (const { data, error } of results) {
      if (error) {
        console.error('Error fetching stamp cards:', error);
        continue;
      }
      const cards = typeof data === 'string' ? JSON.parse(data) : data;
      if (Array.isArray(cards)) {
        allCards.push(...cards);
      }
    }

    return allCards;
  },

  /**
   * Get stamp cards for a specific business
   */
  async getStampCardsForBusiness(
    customerIds: string[],
    businessId: string
  ): Promise<StampCard[]> {
    if (customerIds.length === 0) return [];

    const results = await Promise.all(
      customerIds.map((customerId) =>
        supabase.rpc('get_customer_stamp_cards', {
          p_customer_id: customerId,
          p_business_id: businessId,
        })
      ),
    );

    const allCards: StampCard[] = [];
    for (const { data, error } of results) {
      if (error) {
        console.error('Error fetching stamp cards for business:', error);
        continue;
      }
      const cards = typeof data === 'string' ? JSON.parse(data) : data;
      if (Array.isArray(cards)) {
        allCards.push(...cards);
      }
    }

    return allCards;
  },
};
