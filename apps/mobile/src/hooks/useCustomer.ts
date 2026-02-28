// src/hooks/useCustomer.ts

import { useAuth } from './useAuth';
import { getTier, getNextTier, getProgressToNextTier } from '../lib/constants';
import type { TierLevel } from '../types/rewards.types';

export function useCustomer() {
  const {
    customer,
    totalPoints,
    lifetimePoints: authLifetimePoints,
    customerIds,
    refreshCustomer,
  } = useAuth();

  // Use aggregated points from AuthProvider (sum across all businesses)
  const points = totalPoints;
  const lifetimePoints = authLifetimePoints;
  const tier = (customer?.tier as TierLevel) ?? 'bronze';

  // Calculate tier info using lifetime points
  const currentTier = getTier(lifetimePoints);
  const nextTier = getNextTier(lifetimePoints);
  const tierProgress = getProgressToNextTier(lifetimePoints);

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
    customerIds,
    refreshCustomer,
  };
}
