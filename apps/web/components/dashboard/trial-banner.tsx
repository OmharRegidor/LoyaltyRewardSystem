'use client';

import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

interface TrialBannerProps {
  trialDaysRemaining: number | null;
  isTrialing: boolean;
  isTrialExpired: boolean;
}

export function TrialBanner({
  trialDaysRemaining,
  isTrialing,
  isTrialExpired,
}: TrialBannerProps) {
  if (!isTrialing && !isTrialExpired) return null;

  // Active trial
  if (isTrialing && !isTrialExpired) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-amber-50 border border-primary/20 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                Enterprise Trial Active
              </p>
              <p className="text-sm text-gray-600">
                {trialDaysRemaining !== null && trialDaysRemaining > 0
                  ? `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} remaining — POS & Inventory unlocked`
                  : 'Less than a day remaining — POS & Inventory unlocked'}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings/billing"
            className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shrink-0"
          >
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Expired trial
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">
              Enterprise Trial Ended
            </p>
            <p className="text-sm text-gray-600">
              Your 14-day trial has ended. Upgrade to continue using POS & Inventory.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shrink-0"
        >
          Upgrade — ₱1,490/mo
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
