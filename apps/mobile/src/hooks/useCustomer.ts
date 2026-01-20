// src/hooks/useCustomer.ts

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { getTier, getNextTier, getProgressToNextTier } from '../lib/constants';
import type { TierLevel } from '../types/rewards.types';
import { Customer } from '@/src/types/database.types';

export function useCustomer() {
  const { customer: authCustomer, refreshCustomer } = useAuth();

  // Local state for real-time updates
  const [customer, setCustomer] = useState(authCustomer);

  // Sync with auth customer
  useEffect(() => {
    setCustomer(authCustomer);
  }, [authCustomer]);

  // Real-time subscription for customer updates
  useEffect(() => {
    if (!authCustomer?.id) return;

    const channel = supabase
      .channel(`customer-${authCustomer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
          filter: `id=eq.${authCustomer.id}`,
        },
        (payload) => {
          console.log('[useCustomer] Real-time update:', payload.new);
          setCustomer((prev) => {
            if (!prev) return payload.new as Customer;

            return {
              ...prev,
              ...payload.new,
            } as Customer;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authCustomer?.id]);

  // Extract values with defaults
  const points = customer?.total_points ?? 0;
  const lifetimePoints = customer?.lifetime_points ?? 0;
  const tier = (customer?.tier as TierLevel) ?? 'bronze';

  // Calculate tier info using lifetime points
  const currentTier = getTier(lifetimePoints);
  const nextTier = getNextTier(lifetimePoints);
  const tierProgress = getProgressToNextTier(lifetimePoints);

  // Debug log
  if (__DEV__) {
    console.log('[useCustomer]', {
      customerId: customer?.id,
      points,
      lifetimePoints,
      tier,
    });
  }

  return {
    customer,
    qrCodeUrl: customer?.qr_code_url ?? null,
    points,
    lifetimePoints,
    tier,
    currentTier,
    nextTier,
    tierProgress,
    lastVisit: customer?.last_visit ?? null,
    refreshCustomer,
  };
}
