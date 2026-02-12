// src/services/customer.service.ts

import { supabase } from '../lib/supabase';
import type { Customer } from '../types/database.types';
import { nanoid } from 'nanoid/non-secure';

// ============================================
// CONSTANTS
// ============================================

/**
 * Explicit column selection to ensure all fields are fetched
 */
const CUSTOMER_COLUMNS = `
  id,
  user_id,
  full_name,
  email,
  phone,
  total_points,
  lifetime_points,
  tier,
  qr_code_url,
  last_visit,
  created_at
` as const;

// ============================================
// TYPES
// ============================================

interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
}

// ============================================
// SERVICE
// ============================================

export const customerService = {
  /**
   * Get customer by user ID with all fields
   */
  async getByUserId(userId: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(CUSTOMER_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[CustomerService] getByUserId error:', error.message);
      throw error;
    }

    return data;
  },

  /**
   * Link OAuth user to existing customer by email
   * Returns the linked customer ID or null if no match found
   */
  async linkByEmail(userId: string, email: string): Promise<string | null> {
    // Call the database function to link customer
    const { data, error } = await supabase.rpc('link_oauth_to_customer', {
      p_user_id: userId,
      p_email: email,
    });

    if (error) {
      // Don't throw - this is not critical, we can create a new customer
      return null;
    }

    return data as string | null;
  },

  /**
   * Link OAuth user to existing customer by phone
   * Returns the linked customer ID or null if no match found
   */
  async linkByPhone(userId: string, phone: string): Promise<string | null> {
    const { data, error } = await supabase.rpc(
      'link_oauth_to_customer_by_phone',
      {
        p_user_id: userId,
        p_phone: phone,
      },
    );

    if (error) {
      return null;
    }

    return data as string | null;
  },

  /**
   * Create new customer with profile data
   */
  async create(profile: UserProfile): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: profile.id,
        full_name: profile.fullName || null,
        email: profile.email || null,
        phone: null,
        total_points: 0,
        lifetime_points: 0,
        tier: 'bronze',
        qr_code_url: `NoxaLoyalty://customer/${nanoid(16)}`,
      })
      .select(CUSTOMER_COLUMNS)
      .single();

    if (error) {
      console.error('[CustomerService] create error:', error.message);
      throw error;
    }

    return data;
  },

  /**
   * Update customer profile (name, email)
   */
  async updateProfile(
    customerId: string,
    profile: { fullName?: string; email?: string },
  ): Promise<void> {
    const updates: Record<string, string | null> = {};
    if (profile.fullName) updates.full_name = profile.fullName;
    if (profile.email) updates.email = profile.email;

    if (Object.keys(updates).length === 0) return;

    const { error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId);

    if (error) {
      console.error('[CustomerService] updateProfile error:', error.message);
      // Don't throw - profile update is not critical
    }
  },

  /**
   * Find existing customer or create new one
   *
   * Flow:
   * 1. Check if customer exists by user_id (already linked)
   * 2. If not, try to link by email (staff-added customer)
   * 3. If linked, update profile and return
   * 4. If no match, create new customer
   */
  async findOrCreate(profile: UserProfile): Promise<Customer> {
    // Step 1: Check if already linked by user_id
    const existingByUserId = await this.getByUserId(profile.id);
    if (existingByUserId) {
      // Update profile if missing
      if (!existingByUserId.full_name || !existingByUserId.email) {
        await this.updateProfile(existingByUserId.id, {
          fullName: existingByUserId.full_name || profile.fullName,
          email: existingByUserId.email || profile.email,
        });
      }

      return existingByUserId;
    }

    // Step 2: Try to link by email (for staff-added customers)
    if (profile.email) {
      const linkedCustomerId = await this.linkByEmail(
        profile.id,
        profile.email,
      );

      if (linkedCustomerId) {
        // Fetch the linked customer
        const linkedCustomer = await this.getByUserId(profile.id);

        if (linkedCustomer) {
          // Update profile with OAuth data
          await this.updateProfile(linkedCustomer.id, {
            fullName: linkedCustomer.full_name || profile.fullName,
            email: linkedCustomer.email || profile.email,
          });

          return linkedCustomer;
        }
      }
    }

    // Step 2b: Try to link by phone (for self-signup customers without email)
    if (profile.phone) {
      const phoneLinkedId = await this.linkByPhone(profile.id, profile.phone);

      if (phoneLinkedId) {
        const phoneLinkedCustomer = await this.getByUserId(profile.id);

        if (phoneLinkedCustomer) {
          await this.updateProfile(phoneLinkedCustomer.id, {
            fullName: phoneLinkedCustomer.full_name || profile.fullName,
            email: phoneLinkedCustomer.email || profile.email,
          });

          return phoneLinkedCustomer;
        }
      }
    }

    // Step 3: No existing customer found, create new one
    return this.create(profile);
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
