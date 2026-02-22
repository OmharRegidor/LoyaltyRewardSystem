// src/hooks/useReferral.ts

import { useState, useEffect, useCallback } from 'react';
import { Share } from 'react-native';
import { useCustomer } from './useCustomer';
import { referralService } from '../services/referral.service';

// ============================================
// TYPES
// ============================================

interface CustomerBusiness {
  business_id: string;
  name: string;
  logo_url: string | null;
}

interface ReferralHistoryItem {
  id: string;
  business_id: string;
  referrer_points: number;
  invitee_points: number;
  completed_at: string;
  invitee: { full_name: string | null } | null;
  business: { name: string; logo_url: string | null } | null;
}

// ============================================
// HOOK
// ============================================

export function useReferral() {
  const { customer } = useCustomer();

  const [businesses, setBusinesses] = useState<CustomerBusiness[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer's businesses
  useEffect(() => {
    if (!customer?.id) return;

    const fetchBusinesses = async () => {
      try {
        setIsLoadingBusinesses(true);
        const data = await referralService.getCustomerBusinesses(customer.id);
        setBusinesses(data);
        if (data.length === 1) {
          setSelectedBusinessId(data[0].business_id);
        }
      } catch (err) {
        console.error('[useReferral] fetchBusinesses error:', err);
        setError('Failed to load businesses');
      } finally {
        setIsLoadingBusinesses(false);
      }
    };

    fetchBusinesses();
  }, [customer?.id]);

  // Fetch referral code when business is selected
  useEffect(() => {
    if (!customer?.id || !selectedBusinessId) {
      setReferralCode(null);
      return;
    }

    const fetchCode = async () => {
      try {
        setIsLoadingCode(true);
        setError(null);
        const code = await referralService.getReferralCode(
          customer.id,
          selectedBusinessId,
        );
        setReferralCode(code);
      } catch (err) {
        console.error('[useReferral] fetchCode error:', err);
        setError('Failed to generate referral code');
      } finally {
        setIsLoadingCode(false);
      }
    };

    fetchCode();
  }, [customer?.id, selectedBusinessId]);

  // Fetch referral history
  const fetchHistory = useCallback(async () => {
    if (!customer?.id) return;

    try {
      setIsLoadingHistory(true);
      const data = await referralService.getReferralHistory(customer.id);
      setHistory(data);
    } catch (err) {
      console.error('[useReferral] fetchHistory error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [customer?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Share referral code
  const shareReferralCode = useCallback(async () => {
    if (!referralCode || !selectedBusinessId) return;

    const business = businesses.find((b) => b.business_id === selectedBusinessId);
    const businessName = business?.name || 'this business';

    try {
      await Share.share({
        message: `Join ${businessName} loyalty program and earn bonus points! Use my referral code: ${referralCode}`,
      });
    } catch (err) {
      console.error('[useReferral] share error:', err);
    }
  }, [referralCode, selectedBusinessId, businesses]);

  const selectedBusiness = businesses.find(
    (b) => b.business_id === selectedBusinessId,
  ) || null;

  return {
    businesses,
    selectedBusinessId,
    setSelectedBusinessId,
    selectedBusiness,
    referralCode,
    history,
    isLoadingBusinesses,
    isLoadingCode,
    isLoadingHistory,
    error,
    shareReferralCode,
    refreshHistory: fetchHistory,
  };
}
