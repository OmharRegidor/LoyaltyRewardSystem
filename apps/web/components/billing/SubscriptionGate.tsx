// apps/web/components/billing/SubscriptionGate.tsx

'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { Lock, Zap, AlertTriangle, CreditCard } from 'lucide-react';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature?: string;
  limitType?: 'customers' | 'branches' | 'staff';
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

// ============================================
// PREVIEW MODE BANNER
// ============================================

export function PreviewModeBanner() {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) return null;
  if (!subscription) return null;
  if (subscription.hasAccess) return null;

  return (
    <div className="bg-linear-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5" />
          <div>
            <span className="font-medium">You're in Preview Mode</span>
            <span className="hidden sm:inline text-white/90 ml-2">
              — Subscribe to unlock all features and add real data
            </span>
          </div>
        </div>
        <Link
          href="/pricing"
          className="bg-white text-orange-600 px-4 py-1.5 rounded-lg font-medium text-sm hover:bg-orange-50 transition-colors flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Subscribe Now
        </Link>
      </div>
    </div>
  );
}

// ============================================
// PAST DUE BANNER
// ============================================

export function PastDueBanner() {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) return null;
  if (!subscription) return null;
  if (subscription.status !== 'past_due') return null;

  return (
    <div className="bg-red-500 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <span className="font-medium">Payment Failed</span>
            <span className="hidden sm:inline text-white/90 ml-2">
              — Please update your payment method to continue using NoxaLoyalty
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/settings/billing"
          className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Update Payment
        </Link>
      </div>
    </div>
  );
}

// ============================================
// SUBSCRIPTION GATE COMPONENT
// ============================================

export function SubscriptionGate({
  children,
  feature,
  limitType,
  fallback,
  showUpgradePrompt = true,
}: SubscriptionGateProps) {
  const { subscription, isLoading, canUseFeature, isWithinLimit } =
    useSubscription();

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  // No subscription data
  if (!subscription) {
    return fallback || <LockedContent showUpgradePrompt={showUpgradePrompt} />;
  }

  // Check feature access
  if (feature && !canUseFeature(feature)) {
    return (
      fallback || (
        <LockedContent
          showUpgradePrompt={showUpgradePrompt}
          message={`Upgrade to access ${feature.replace(/_/g, ' ')}`}
        />
      )
    );
  }

  // Check limits
  if (limitType && !isWithinLimit(limitType)) {
    return (
      fallback || (
        <LimitReachedContent
          limitType={limitType}
          showUpgradePrompt={showUpgradePrompt}
        />
      )
    );
  }

  // Has access
  if (!subscription.hasAccess) {
    return fallback || <LockedContent showUpgradePrompt={showUpgradePrompt} />;
  }

  return <>{children}</>;
}

// ============================================
// LOCKED CONTENT COMPONENT
// ============================================

interface LockedContentProps {
  showUpgradePrompt: boolean;
  message?: string;
}

function LockedContent({ showUpgradePrompt, message }: LockedContentProps) {
  if (!showUpgradePrompt) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {message || 'Subscribe to Unlock'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        This feature is available on paid plans. Subscribe to access all
        features and start growing your business.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
      >
        <Zap className="w-5 h-5" />
        View Plans
      </Link>
    </div>
  );
}

// ============================================
// LIMIT REACHED COMPONENT
// ============================================

interface LimitReachedContentProps {
  limitType: 'customers' | 'branches' | 'staff';
  showUpgradePrompt: boolean;
}

function LimitReachedContent({
  limitType,
  showUpgradePrompt,
}: LimitReachedContentProps) {
  const limitMessages = {
    customers: {
      title: 'Customer Limit Reached',
      description:
        "You've reached your plan's customer limit. Upgrade to add more customers.",
    },
    branches: {
      title: 'Branch Limit Reached',
      description:
        "You've reached your plan's branch limit. Upgrade to add more locations.",
    },
    staff: {
      title: 'Staff Limit Reached',
      description:
        "You've reached your plan's staff limit. Upgrade to add more team members.",
    },
  };

  const { title, description } = limitMessages[limitType];

  if (!showUpgradePrompt) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
      >
        <Zap className="w-5 h-5" />
        Upgrade Plan
      </Link>
    </div>
  );
}

// ============================================
// USAGE INDICATOR COMPONENT
// ============================================

interface UsageIndicatorProps {
  limitType: 'customers' | 'branches' | 'staff';
  showWarningAt?: number; // Percentage at which to show warning (default: 80)
}

export function UsageIndicator({
  limitType,
  showWarningAt = 80,
}: UsageIndicatorProps) {
  const { subscription, getUsagePercentage, isLoading } = useSubscription();

  const getUsageCount = (
    limitType: 'customers' | 'branches' | 'staff',
  ): number => {
    return subscription?.usage[limitType] || 0;
  };

  const getLimit = (
    limitType: 'customers' | 'branches' | 'staff',
  ): number | null => {
    const limit = subscription?.limits[limitType];
    return limit !== undefined && Number.isFinite(limit) ? limit : null;
  };

  if (isLoading || !subscription) return null;
  if (subscription.isFreeForever) return null;

  const percentage = getUsagePercentage(limitType);
  const usage = getUsageCount(limitType);
  const limit = getLimit(limitType);

  const isWarning = percentage >= showWarningAt;
  const isCritical = percentage >= 100;

  const labels = {
    customers: 'Customers',
    branches: 'Branches',
    staff: 'Staff',
  };

  const getUsageText = (): string => {
    const limitDisplay = limit !== null ? limit : '∞';
    return `${usage} / ${limitDisplay}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {labels[limitType]}
        </span>
        <span
          className={`font-medium ${
            isCritical
              ? 'text-red-600'
              : isWarning
                ? 'text-amber-600'
                : 'text-gray-900 dark:text-white'
          }`}
        >
          {getUsageText()}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isCritical
              ? 'bg-red-500'
              : isWarning
                ? 'bg-amber-500'
                : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isWarning && !isCritical && (
        <p className="text-xs text-amber-600">
          Approaching limit.{' '}
          <Link href="/pricing" className="underline">
            Upgrade
          </Link>{' '}
          for more.
        </p>
      )}
      {isCritical && (
        <p className="text-xs text-red-600">
          Limit reached.{' '}
          <Link href="/pricing" className="underline">
            Upgrade
          </Link>{' '}
          to add more.
        </p>
      )}
    </div>
  );
}
