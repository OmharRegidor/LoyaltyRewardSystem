// apps/web/app/checkout/[planId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  Check,
  Loader2,
  Mail,
  Lock,
  User,
  Building2,
  ArrowLeft,
  Zap,
  Crown,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// PLAN DATA
// ============================================

const PLANS: Record<
  string,
  {
    id: string;
    name: string;
    displayName: string;
    priceMonthly: number;
    priceAnnual: number;
    features: string[];
    icon: 'zap' | 'crown';
  }
> = {
  core: {
    id: 'core',
    name: 'core',
    displayName: 'Core',
    priceMonthly: 3499,
    priceAnnual: 34990,
    features: [
      'Up to 3,000 customers',
      'Up to 3 branches',
      '3 staff per branch',
      'QR-based loyalty rewards',
      'Points & stamps system',
      'Basic analytics',
      'Email support',
    ],
    icon: 'zap',
  },
  enterprise: {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    priceMonthly: 9999,
    priceAnnual: 99990,
    features: [
      'Unlimited customers',
      'Unlimited branches',
      'Unlimited staff',
      'Advanced analytics',
      'API access',
      'Webhooks integration',
      'Custom branding',
      'Priority support',
      'Dedicated account manager',
    ],
    icon: 'crown',
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const planId = params.planId as string;
  const interval =
    (searchParams.get('interval') as 'monthly' | 'annual') || 'monthly';
  const plan = PLANS[planId];

  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // User already logged in, redirect to billing with plan
        router.push(
          `/dashboard/settings/billing?plan=${planId}&interval=${interval}`
        );
      }
    };
    checkAuth();
  }, [supabase, router, planId, interval]);

  // Invalid plan
  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Plan not found</h1>
          <Link href="/#pricing" className="text-blue-600 hover:underline">
            View available plans
          </Link>
        </div>
      </div>
    );
  }

  const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            business_name: formData.businessName,
            selected_plan: planId,
            billing_interval: interval,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?plan=${planId}&interval=${interval}`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        setEmail(formData.email);
        setStep('verify');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?plan=${planId}&interval=${interval}`,
        },
      });
      if (error) throw error;
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
            <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              LoyaltyHub
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Secure checkout</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Form */}
          <div>
            {step === 'signup' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl font-bold mb-2">Create your account</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Get started with {plan.displayName} plan
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Juan Dela Cruz"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Business Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            businessName: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="My Awesome Business"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="you@business.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                        minLength={8}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Min. 8 characters"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Continue to Payment
                        <Zap className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link
                    href={`/login?redirect=/dashboard/settings/billing?plan=${planId}&interval=${interval}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Check your email</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  We sent a verification link to
                </p>
                <p className="font-semibold text-lg mb-6">{email}</p>
                <p className="text-sm text-gray-500 mb-8">
                  Click the link in the email to verify your account and
                  continue to payment.
                </p>

                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="text-blue-600 hover:underline font-medium disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : "Didn't receive it? Resend email"}
                </button>
              </motion.div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:pl-12 lg:border-l lg:border-gray-200 dark:lg:border-gray-800">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                {/* Plan Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      plan.icon === 'crown'
                        ? 'bg-linear-to-br from-purple-500 to-pink-500'
                        : 'bg-linear-to-br from-blue-500 to-cyan-500'
                    }`}
                  >
                    {plan.icon === 'crown' ? (
                      <Crown className="w-7 h-7 text-white" />
                    ) : (
                      <Zap className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{plan.displayName}</h3>
                    <p className="text-gray-500">
                      {interval === 'annual'
                        ? 'Annual billing'
                        : 'Monthly billing'}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                  {plan.features.slice(0, 5).map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 5 && (
                    <p className="text-sm text-gray-500 pl-7">
                      +{plan.features.length - 5} more features
                    </p>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {plan.displayName} ({interval})
                    </span>
                    <span className="font-medium">{formatPrice(price)}</span>
                  </div>
                  {interval === 'annual' && (
                    <div className="flex justify-between text-green-600">
                      <span>Annual savings</span>
                      <span>
                        -
                        {formatPrice(plan.priceMonthly * 12 - plan.priceAnnual)}
                      </span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-between">
                    <span className="font-semibold">Total due today</span>
                    <span className="font-bold text-xl">
                      {formatPrice(price)}
                    </span>
                  </div>
                </div>

                {/* Interval Switch */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Billing cycle</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(`/checkout/${planId}?interval=monthly`)
                        }
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          interval === 'monthly'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/checkout/${planId}?interval=annual`)
                        }
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          interval === 'annual'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        Annual
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
