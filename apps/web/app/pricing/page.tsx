// apps/web/app/pricing/page.tsx

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Zap,
  Building2,
  Users,
  BarChart3,
  Shield,
  Headphones,
  Code,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface PlanFeature {
  name: string;
  core: boolean | string;
  enterprise: boolean | string;
}

// ============================================
// DATA
// ============================================

const PLANS = {
  core: {
    id: 'core',
    name: 'Core',
    description: 'Perfect for small to medium businesses',
    monthlyPrice: 3500,
    annualPrice: 35000,
    isRecommended: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For growing businesses with multiple locations',
    monthlyPrice: 9999,
    annualPrice: 99990,
    isRecommended: false,
  },
};

const FEATURES: PlanFeature[] = [
  { name: 'QR-based loyalty system', core: true, enterprise: true },
  { name: 'Email QR onboarding', core: true, enterprise: true },
  { name: 'Customer limit', core: '3,000', enterprise: 'Unlimited' },
  { name: 'Branch locations', core: '3', enterprise: 'Unlimited' },
  { name: 'Staff accounts', core: '3 (1 per branch)', enterprise: 'Unlimited' },
  { name: 'Basic analytics', core: true, enterprise: true },
  { name: 'Advanced analytics', core: false, enterprise: true },
  { name: 'Custom branding', core: false, enterprise: true },
  { name: 'API access', core: false, enterprise: true },
  { name: 'Webhook notifications', core: false, enterprise: true },
  { name: 'Priority support', core: false, enterprise: true },
  { name: 'Dedicated account manager', core: false, enterprise: true },
];

// ============================================
// COMPONENT
// ============================================

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');

  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>(
    'monthly'
  );
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planName: string) => {
    setIsLoading(planName);
    setError(null);

    try {
      // First, check if user is authenticated
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId:
            planName === 'core' ? 'CORE_PLAN_UUID' : 'ENTERPRISE_PLAN_UUID', // Replace with actual UUIDs
          billingInterval,
        }),
      });

      if (response.status === 401) {
        // Not authenticated, redirect to signup
        router.push('/signup');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAnnualSavings = (monthly: number, annual: number) => {
    const yearlyAtMonthly = monthly * 12;
    const savings = yearlyAtMonthly - annual;
    return formatPrice(savings);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Canceled notice */}
        {canceled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800 dark:text-yellow-200">
              Checkout was canceled. Feel free to try again when you're ready.
            </p>
          </motion.div>
        )}

        {/* Hero */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Simple, transparent pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Choose the plan that best fits your business. No hidden fees, cancel
            anytime.
          </motion.p>
        </div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                billingInterval === 'annual'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Annual
              <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 max-w-3xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Core Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`relative bg-white dark:bg-gray-900 rounded-2xl border-2 ${
              PLANS.core.isRecommended
                ? 'border-blue-500 shadow-xl shadow-blue-500/10'
                : 'border-gray-200 dark:border-gray-800'
            } p-8`}
          >
            {PLANS.core.isRecommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                  Recommended
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {PLANS.core.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {PLANS.core.description}
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(
                    billingInterval === 'annual'
                      ? PLANS.core.annualPrice / 12
                      : PLANS.core.monthlyPrice
                  )}
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              {billingInterval === 'annual' && (
                <p className="text-sm text-green-600 mt-2">
                  Save{' '}
                  {getAnnualSavings(
                    PLANS.core.monthlyPrice,
                    PLANS.core.annualPrice
                  )}{' '}
                  per year
                </p>
              )}
            </div>

            <button
              onClick={() => handleSelectPlan('core')}
              disabled={isLoading !== null}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading === 'core' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Get Started'
              )}
            </button>

            <ul className="mt-8 space-y-4">
              {FEATURES.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  {feature.core === true ? (
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : feature.core === false ? (
                    <X className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                  ) : (
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-sm ${
                      feature.core === false
                        ? 'text-gray-400 dark:text-gray-600'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {feature.name}
                    {typeof feature.core === 'string' && (
                      <span className="font-medium ml-1">({feature.core})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {PLANS.enterprise.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {PLANS.enterprise.description}
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(
                    billingInterval === 'annual'
                      ? PLANS.enterprise.annualPrice / 12
                      : PLANS.enterprise.monthlyPrice
                  )}
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              {billingInterval === 'annual' && (
                <p className="text-sm text-green-600 mt-2">
                  Save{' '}
                  {getAnnualSavings(
                    PLANS.enterprise.monthlyPrice,
                    PLANS.enterprise.annualPrice
                  )}{' '}
                  per year
                </p>
              )}
            </div>

            <button
              onClick={() => handleSelectPlan('enterprise')}
              disabled={isLoading !== null}
              className="w-full py-3 px-6 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading === 'enterprise' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Get Started'
              )}
            </button>

            <ul className="mt-8 space-y-4">
              {FEATURES.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  {feature.enterprise === true ? (
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : feature.enterprise === false ? (
                    <X className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                  ) : (
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature.name}
                    {typeof feature.enterprise === 'string' && (
                      <span className="font-medium ml-1">
                        ({feature.enterprise})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Questions?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're here to help. Contact us anytime.
          </p>
          <a
            href="mailto:support@loyaltyhub.ph"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            support@loyaltyhub.ph
          </a>
        </motion.div>
      </main>
    </div>
  );
}
