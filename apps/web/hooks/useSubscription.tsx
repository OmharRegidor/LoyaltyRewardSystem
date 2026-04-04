// apps/web/hooks/useSubscription.ts

'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  hasLoyalty: boolean;
  hasPOS: boolean;
  hasStampCard: boolean;
}

interface SubscriptionData {
  status: string;
  hasAccess: boolean;
  isFreeForever: boolean;
  isAdminManaged: boolean;
  upgradeAcknowledged: boolean;
  pendingUpgradeRequest: boolean;
  loyaltyMode: 'points' | 'stamps';
  plan: Plan | null;
  billingInterval: 'monthly' | 'annual' | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: {
    customers: number;
    branches: number;
    staff: number;
  };
  usage: {
    customers: number;
    branches: number;
    staff: number;
  };
}

interface SubscriptionContextValue {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  canUseFeature: (feature: string) => boolean;
  isWithinLimit: (limitType: 'customers' | 'branches' | 'staff') => boolean;
  getUsagePercentage: (limitType: 'customers' | 'branches' | 'staff') => number;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// ============================================
// PROVIDER — Wrap at dashboard layout level
// ============================================

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/billing/status');

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const refetch = useCallback(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const canUseFeature = useCallback(
    (feature: string): boolean => {
      if (!subscription) return false;
      if (subscription.isFreeForever) return true;
      if (!subscription.hasAccess) return false;

      const coreFeatures = [
        'qr_loyalty',
        'email_onboarding',
        'basic_analytics',
        'rewards',
        'tiers',
      ];
      return coreFeatures.includes(feature);
    },
    [subscription]
  );

  const isWithinLimit = useCallback(
    (limitType: 'customers' | 'branches' | 'staff'): boolean => {
      if (!subscription) return false;
      if (subscription.isFreeForever) return true;

      const limit = subscription.limits[limitType];
      const usage = subscription.usage[limitType];

      if (limit === null || limit === undefined || !Number.isFinite(limit))
        return true;

      return usage < limit;
    },
    [subscription]
  );

  const getUsagePercentage = useCallback(
    (limitType: 'customers' | 'branches' | 'staff'): number => {
      if (!subscription) return 0;

      const limit = subscription.limits[limitType];
      const usage = subscription.usage[limitType];

      if (limit === null || limit === undefined || !Number.isFinite(limit))
        return 0;
      if (limit === 0) return 100;

      return Math.min(100, Math.round((usage / limit) * 100));
    },
    [subscription]
  );

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        error,
        refetch,
        canUseFeature,
        isWithinLimit,
        getUsagePercentage,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// ============================================
// HOOK — Consumes from context (single fetch)
// ============================================

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  // Fallback: if used outside provider, fetch independently (backwards compatible)
  const [fallbackSubscription, setFallbackSubscription] = useState<SubscriptionData | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(true);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  useEffect(() => {
    if (context) return; // Provider exists, skip fallback

    async function fetchDirect() {
      try {
        const response = await fetch('/api/billing/status');
        if (!response.ok) throw new Error('Failed to fetch subscription');
        const data = await response.json();
        setFallbackSubscription(data);
      } catch (err) {
        setFallbackError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setFallbackLoading(false);
      }
    }

    fetchDirect();
  }, [context]);

  if (context) return context;

  // Fallback return for usage outside provider
  return {
    subscription: fallbackSubscription,
    isLoading: fallbackLoading,
    error: fallbackError,
    refetch: () => {},
    canUseFeature: () => false,
    isWithinLimit: () => false,
    getUsagePercentage: () => 0,
  };
}
