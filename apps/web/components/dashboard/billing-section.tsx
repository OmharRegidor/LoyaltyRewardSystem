'use client';

import { Crown, Zap, CalendarDays, CalendarClock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { ManualInvoiceSection } from '@/components/dashboard/manual-invoice-section';
import { UpgradeRequestForm } from '@/components/dashboard/upgrade-request-form';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getDaysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

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
  const periodStart = subscription?.currentPeriodStart;
  const periodEnd = subscription?.currentPeriodEnd;
  const daysLeft = periodEnd ? getDaysUntil(periodEnd) : null;

  return (
    <div className="space-y-4 pt-4">
      {/* Current Plan */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base font-semibold">Current Plan</h3>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
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

          {/* Plan period dates for Enterprise */}
          {isEnterprise && periodStart && periodEnd && (
            <div className="border border-gray-100 rounded-xl p-3 sm:p-4 bg-gray-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Plan Started</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(periodStart)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Plan Ends</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(periodEnd)}</p>
                  </div>
                </div>
              </div>
              {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
                <p className="text-xs text-amber-600 font-medium mt-2">
                  Your plan expires in {daysLeft} day{daysLeft === 1 ? '' : 's'}. Contact NoxaLoyalty to renew.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upgrade CTA for Free plan */}
      {isFree && <UpgradeRequestForm onUpgradeSubmitted={refetch} />}

      {/* Invoices for Enterprise */}
      {isEnterprise && <ManualInvoiceSection />}
    </div>
  );
}
