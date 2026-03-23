'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, Gift, ChevronRight } from 'lucide-react';

interface OnboardingBannerProps {
  activeRewardCount: number;
  pesosPerPoint: number | null;
  referralRewardPoints: number | null;
  businessSlug?: string | null;
  hasFirstTransaction?: boolean;
}

interface ChecklistItem {
  label: string;
  href: string;
  completed: boolean;
}

export function OnboardingBanner({
  activeRewardCount,
  pesosPerPoint,
  referralRewardPoints,
  businessSlug,
  hasFirstTransaction = false,
}: OnboardingBannerProps) {
  const items: ChecklistItem[] = [
    {
      label: 'Create your first reward',
      href: '/dashboard/rewards',
      completed: activeRewardCount > 0,
    },
    {
      label: 'Set your loyalty rate',
      href: '/dashboard/settings',
      completed: pesosPerPoint !== null && pesosPerPoint > 0,
    },
    {
      label: 'Configure referral points',
      href: '/dashboard/settings',
      completed: referralRewardPoints !== null,
    },
    {
      label: 'Download the customer app',
      href: '/download',
      completed: false,
    },
    {
      label: 'Share your business page',
      href: businessSlug ? `/business/${businessSlug}` : '/dashboard/settings',
      completed: false,
    },
    {
      label: 'Award your first customer points',
      href: '/dashboard/customers',
      completed: hasFirstTransaction,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;

  // Hide banner when all items complete
  if (completedCount === items.length) return null;

  return (
    <div className="bg-gradient-to-r from-primary/5 to-secondary/10 border border-primary/20 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Complete your setup to appear in the business directory
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {completedCount} of {items.length} complete
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-xl bg-white/70 border border-gray-100 px-4 py-3 hover:bg-white transition-colors group"
          >
            <div className="flex items-center gap-3">
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${
                  item.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                }`}
              >
                {item.label}
              </span>
            </div>
            {!item.completed && (
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
