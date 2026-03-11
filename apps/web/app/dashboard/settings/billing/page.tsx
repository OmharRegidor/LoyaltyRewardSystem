// apps/web/app/dashboard/settings/billing/page.tsx

'use client';

import { Suspense } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Zap,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ManualInvoiceSection } from '@/components/dashboard/manual-invoice-section';

// ============================================
// BILLING CONTENT
// ============================================

function BillingContent() {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="rounded-2xl border border-gray-200 p-6 space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-4 py-4 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          View your current plan and invoices
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Current Plan</h2>
        </div>
        <div className="p-4 sm:p-6">
          {subscription?.status === 'preview' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No Active Subscription
              </h3>
              <p className="text-gray-600 mb-6">
                Subscribe to unlock all features.
              </p>
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium"
              >
                <Zap className="w-5 h-5" />
                View Plans
              </Link>
            </div>
          )}

          {subscription?.hasAccess && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 ${
                      subscription.plan?.name === 'enterprise'
                        ? 'bg-gradient-to-br from-secondary to-yellow-500'
                        : 'bg-gradient-to-br from-primary to-primary/70'
                    }`}
                  >
                    {subscription.plan?.name === 'enterprise' ? (
                      <Crown className="w-7 h-7 text-white" />
                    ) : (
                      <Zap className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">
                        {subscription.plan?.displayName || 'Plan'}
                      </h3>
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {subscription.isFreeForever
                        ? 'Unlimited loyalty features'
                        : 'Managed by NoxaLoyalty team'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Invoices (enterprise billing) */}
      <ManualInvoiceSection />
    </div>
  );
}

// ============================================
// MAIN COMPONENT (with Suspense)
// ============================================

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto space-y-8 p-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
