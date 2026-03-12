'use client';

import { Crown, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { ManualInvoiceSection } from '@/components/dashboard/manual-invoice-section';
import { UpgradeRequestForm } from '@/components/dashboard/upgrade-request-form';

export function BillingSection() {
  const { subscription, isLoading, refetch } = useSubscription();

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEnterprise = subscription?.plan?.name === 'enterprise';
  const isFree = subscription?.isFreeForever || subscription?.plan?.name === 'free';

  return (
    <div className="space-y-4 pt-4">
      {/* Current Plan */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base font-semibold">Current Plan</h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isEnterprise
                  ? 'bg-gradient-to-br from-secondary to-yellow-500'
                  : 'bg-gradient-to-br from-primary to-primary/70'
              }`}
            >
              {isEnterprise ? (
                <Crown className="w-6 h-6 text-white" />
              ) : (
                <Zap className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold">
                  {subscription?.plan?.displayName || 'Free'}
                </h4>
                <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {isFree
                  ? 'Unlimited loyalty features'
                  : 'Managed by NoxaLoyalty team'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA for Free plan */}
      {isFree && <UpgradeRequestForm onUpgradeSubmitted={refetch} />}

      {/* Invoices for Enterprise */}
      {isEnterprise && <ManualInvoiceSection />}
    </div>
  );
}
