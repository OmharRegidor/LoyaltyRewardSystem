// src/services/referral.service.ts

import { supabase } from '../lib/supabase';

// ============================================
// TYPES
// ============================================

interface ReferralCompletion {
  id: string;
  business_id: string;
  referrer_points: number;
  invitee_points: number;
  completed_at: string;
  invitee: {
    full_name: string | null;
  } | null;
  business: {
    name: string;
    logo_url: string | null;
  } | null;
}

export interface ReferralCodePreview {
  id: string;
  code: string;
  customer_id: string;
  business_id: string;
  uses: number;
  max_uses: number;
  is_active: boolean;
  business: {
    name: string;
    logo_url: string | null;
    referral_reward_points: number;
  } | null;
  referrer: {
    full_name: string | null;
  } | null;
}

export interface RedeemReferralResult {
  success: boolean;
  error?: string;
  referrer_points?: number;
  invitee_points?: number;
  business_id?: string;
}

// ============================================
// SERVICE
// ============================================

export const referralService = {
  /**
   * Get or create a referral code for a customer-business pair
   */
  async getReferralCode(
    customerId: string,
    businessId: string,
  ): Promise<string> {
    const { data, error } = await supabase.rpc('get_or_create_referral_code', {
      p_customer_id: customerId,
      p_business_id: businessId,
    });

    if (error) {
      console.error('[ReferralService] getReferralCode error:', error.message);
      throw error;
    }

    return data as string;
  },

  /**
   * Get referral history for a customer (as referrer)
   */
  async getReferralHistory(
    customerId: string,
  ): Promise<ReferralCompletion[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('referral_completions')
      .select(`
        id,
        business_id,
        referrer_points,
        invitee_points,
        completed_at,
        invitee:customers!referral_completions_invitee_customer_id_fkey (full_name),
        business:businesses!referral_completions_business_id_fkey (name, logo_url)
      `)
      .eq('referrer_customer_id', customerId)
      .order('completed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[ReferralService] getReferralHistory error:', error.message);
      throw error;
    }

    return (data || []) as ReferralCompletion[];
  },

  /**
   * Get customer's businesses for the business selector
   */
  async getCustomerBusinesses(
    customerId: string,
  ): Promise<{ business_id: string; name: string; logo_url: string | null }[]> {
    const { data, error } = await supabase
      .from('customer_businesses')
      .select(`
        business_id,
        businesses:business_id (name, logo_url)
      `)
      .eq('customer_id', customerId);

    if (error) {
      console.error('[ReferralService] getCustomerBusinesses error:', error.message);
      throw error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      business_id: row.business_id,
      name: row.businesses?.name || 'Unknown',
      logo_url: row.businesses?.logo_url || null,
    }));
  },

  /**
   * Look up a referral code with business and referrer info
   */
  async lookupReferralCode(code: string): Promise<ReferralCodePreview | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('referral_codes')
      .select(`
        id,
        code,
        customer_id,
        business_id,
        uses,
        max_uses,
        is_active,
        business:businesses!referral_codes_business_id_fkey (name, logo_url, referral_reward_points),
        referrer:customers!referral_codes_customer_id_fkey (full_name)
      `)
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[ReferralService] lookupReferralCode error:', error.message);
      throw error;
    }

    return data as ReferralCodePreview;
  },

  /**
   * Redeem a referral code for the invitee
   */
  async redeemReferralCode(
    code: string,
    inviteeCustomerId: string,
  ): Promise<RedeemReferralResult> {
    const { data, error } = await supabase.rpc('complete_referral', {
      p_referral_code: code.toUpperCase().trim(),
      p_invitee_customer_id: inviteeCustomerId,
    });

    if (error) {
      console.error('[ReferralService] redeemReferralCode error:', error.message);
      throw error;
    }

    return data as RedeemReferralResult;
  },
};
