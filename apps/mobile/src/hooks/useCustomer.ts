// src/hooks/useCustomer.ts

import { useAuth } from './useAuth';
import { getTier, getNextTier, getProgressToNextTier } from '../lib/constants';
import type { TierLevel } from '../types/rewards.types';

export function useCustomer() {
  const { customer, refreshCustomer } = useAuth();

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
