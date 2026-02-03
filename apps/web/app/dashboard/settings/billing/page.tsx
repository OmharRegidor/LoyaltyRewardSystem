// apps/web/app/dashboard/settings/billing/page.tsx

'use client';

import { Suspense } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Loader2,
  Zap,
  Crown,
  Mail,
  CheckCircle,
} from 'lucide-react';

const FREE_FEATURES = [
  'Unlimited customers',
  'Custom rewards program',
  'QR-based loyalty system',
  'Team member accounts',
  'Basic analytics',
  'Email support',
];

const ENTERPRISE_FEATURES = [
  'Everything in Free plan',
  'Booking System',
  'POS Integration',
  'Advanced analytics',
  'API access & webhooks',
  'Priority support',
  'Custom branding',
  'Dedicated account manager',
];

function BillingContent() {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isEnterprise = subscription?.plan?.name === 'enterprise' ||
                       subscription?.isFreeForever ||
                       (subscription?.hasAccess && subscription?.plan?.name !== 'free');

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your subscription plan
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Current Plan</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                isEnterprise
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-500'
              }`}
            >
              {isEnterprise ? (
                <Crown className="w-7 h-7 text-white" />
              ) : (
                <Zap className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">
                  {isEnterprise ? 'Enterprise' : 'Free'} Plan
                </h3>
                <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {isEnterprise
                  ? 'Full access to all features'
                  : 'Core loyalty features included'}
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">
              Plan Features
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {(isEnterprise ? ENTERPRISE_FEATURES : FREE_FEATURES).map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Support Contact */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Need Help?</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isEnterprise
              ? 'For billing inquiries or plan changes, contact your account manager or reach out to our support team.'
              : 'Have questions about your plan or interested in upgrading? Our team is here to help.'}
          </p>
          <a
            href="mailto:support@noxaloyalty.com"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <Mail className="w-4 h-4" />
            support@noxaloyalty.com
          </a>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
