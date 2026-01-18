// apps/web/hooks/useSubscription.ts

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Plan {
  id: string;
  name: string;
  displayName: string;
}

interface SubscriptionData {
  status: string;
  hasAccess: boolean;
  isFreeForever: boolean;
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

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
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

  // Helper functions
  const canUseFeature = useCallback(
    (feature: string): boolean => {
      if (!subscription) return false;
      if (subscription.isFreeForever) return true;
      if (!subscription.hasAccess) return false;

      // Enterprise has all features
      if (subscription.plan?.name === 'enterprise') return true;

      // Core plan features
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

      // Infinity check (unlimited)
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

  return {
    subscription,
    isLoading,
    error,
    refetch,
    canUseFeature,
    isWithinLimit,
    getUsagePercentage,
  };
}
