// apps/web/hooks/useSubscriptionGate.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

interface SubscriptionGate {
  isPreview: boolean;
  isActive: boolean;
  isLoading: boolean;
  canAddCustomer: boolean;
  canAddReward: boolean;
  canInviteTeam: boolean;
  canViewRealTimeData: boolean;
  subscriptionStatus: string | null;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  checkAndGate: (action: string) => boolean; // Returns true if allowed, false if gated
}

export function useSubscriptionGate(): SubscriptionGate {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null,
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: business } = await supabase
          .from('businesses')
          .select('subscription_status')
          .eq('owner_id', user.id)
          .single();

        if (business) {
          setSubscriptionStatus(business.subscription_status);
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const isPreview = subscriptionStatus === 'preview';
  const isActive = ['active', 'trialing'].includes(
    subscriptionStatus || '',
  );

  // Permissions based on subscription
  const canAddCustomer = isActive;
  const canAddReward = isActive;
  const canInviteTeam = isActive;
  const canViewRealTimeData = isActive;

  // Check if action is allowed, if not show modal
  const checkAndGate = useCallback(
    (action: string): boolean => {
      if (isActive) return true;

      // Show upgrade modal for preview users
      setShowUpgradeModal(true);
      return false;
    },
    [isActive],
  );

  return {
    isPreview,
    isActive,
    isLoading,
    canAddCustomer,
    canAddReward,
    canInviteTeam,
    canViewRealTimeData,
    subscriptionStatus,
    showUpgradeModal,
    setShowUpgradeModal,
    checkAndGate,
  };
}
