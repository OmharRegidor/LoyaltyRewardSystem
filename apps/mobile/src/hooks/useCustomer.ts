// src/hooks/useCustomer.ts

import { useAuth } from './useAuth';
import { getTier, getNextTier, getProgressToNextTier } from '../lib/constants';

export function useCustomer() {
  const { customer, refreshCustomer } = useAuth();

  const points = customer?.total_points ?? 0;
  const lifetimePoints = customer?.lifetime_points ?? 0;
  const tier = customer?.tier ?? 'bronze';

  // Calculate tier info
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
    refreshCustomer,
  };
}
