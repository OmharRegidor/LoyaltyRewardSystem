// src/services/customer.service.ts

import { supabase } from '../lib/supabase';
import type { Customer } from '../types/database.types';
import { nanoid } from 'nanoid/non-secure';

// ============================================
// CONSTANTS
// ============================================

/**
 * Explicit column selection to ensure all fields are fetched
 * This prevents issues where SELECT * might not return new columns
 */
const CUSTOMER_COLUMNS = `
  id,
  user_id,
  phone,
  total_points,
  lifetime_points,
  tier,
  qr_code_url,
  last_visit,
  created_at
` as const;

// ============================================
// SERVICE
// ============================================

export const customerService = {
  /**
   * Get customer by user ID with all fields
   */
  async getByUserId(userId: string): Promise<Customer | null> {
    console.log('[CustomerService] getByUserId:', userId);

    const { data, error } = await supabase
      .from('customers')
      .select(CUSTOMER_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[CustomerService] getByUserId error:', error.message);
      throw error;
    }

    console.log('[CustomerService] getByUserId result:', {
      id: data?.id,
      total_points: data?.total_points,
      lifetime_points: data?.lifetime_points,
      tier: data?.tier,
    });

    return data;
  },

  /**
   * Create new customer with default values
   */
  async create(userId: string): Promise<Customer> {
    console.log('[CustomerService] create:', userId);

    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: userId,
        phone: null,
        total_points: 0,
        lifetime_points: 0,
        tier: 'bronze',
        qr_code_url: `loyaltyhub://customer/${nanoid(12)}`,
      })
      .select(CUSTOMER_COLUMNS)
      .single();

    if (error) {
      console.error('[CustomerService] create error:', error.message);
      throw error;
    }

    console.log('[CustomerService] created customer:', data?.id);
    return data;
  },

  /**
   * Find existing customer or create new one
   */
  async findOrCreate(userId: string): Promise<Customer> {
    const existing = await this.getByUserId(userId);
    if (existing) return existing;
    return this.create(userId);
  },

  /**
   * Get customer by ID (for staff lookups)
   */
  async getById(customerId: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(CUSTOMER_COLUMNS)
      .eq('id', customerId)
      .maybeSingle();

    if (error) {
      console.error('[CustomerService] getById error:', error.message);
      throw error;
    }

    return data;
  },
};
