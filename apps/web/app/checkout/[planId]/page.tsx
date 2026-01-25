// apps/web/app/checkout/[planId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Check,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

// ============================================
// PLAN CONFIGURATION
// ============================================

const PLANS = {
  core: {
    id: 'core',
    name: 'Core',
    description: 'Perfect for growing businesses',
    monthly: 3499,
    yearly: 34990,
    yearlySavings: 17,
    features: [
      'Up to 5,000 customers',
      'Up to 3 branches',
      'Up to 10 staff members',
      'QR-based loyalty rewards',
      'Basic analytics',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large-scale operations',
    monthly: 9999,
    yearly: 99990,
    yearlySavings: 17,
    features: [
      'Unlimited customers',
      'Unlimited branches',
      'Unlimited staff',
      'Advanced analytics',
      'Priority support',
    ],
  },
};

type PlanId = keyof typeof PLANS;
type BillingInterval = 'monthly' | 'yearly';

// ============================================
// MAIN COMPONENT
// ============================================

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const planId = params.planId as string;
  const initialInterval =
    (searchParams.get('interval') as BillingInterval) || 'monthly';

  // Validate plan
  const plan = PLANS[planId as PlanId];

  // State
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>(initialInterval);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Form state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(
          `/login?redirect=/checkout/${planId}?interval=${billingInterval}`,
        );
        return;
      }

      setIsAuthenticated(true);

      // Get business ID
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (business) {
        setBusinessId(business.id);
      }

      // Pre-fill cardholder name from user metadata
      const metadata = user.user_metadata || {};
      if (metadata.full_name) {
        setCardholderName(metadata.full_name);
      } else if (metadata.business_name) {
        setCardholderName(metadata.business_name);
      }
    };

    checkAuth();
  }, [planId, billingInterval, router]);

  // Invalid plan
  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Plan Not Found</h1>
          <p className="text-gray-400 mb-6">The selected plan doesn't exist.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  // Calculate pricing
  const price = billingInterval === 'monthly' ? plan.monthly : plan.yearly;
  const monthlyEquivalent =
    billingInterval === 'yearly' ? Math.round(plan.yearly / 12) : plan.monthly;
  const savings =
    billingInterval === 'yearly' ? plan.monthly * 12 - plan.yearly : 0;

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Handle payment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!cardholderName.trim()) {
      setError('Please enter cardholder name');
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid card number');
      return;
    }
    if (expiry.length < 5) {
      setError('Please enter a valid expiry date');
      return;
    }
    if (cvv.length < 3) {
      setError('Please enter a valid CVV');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Integrate with Xendit API
      // This is where you'll call your backend API that connects to Xendit
      //
      // Example API call:
      // const response = await fetch('/api/billing/create-subscription', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     planId: plan.id,
      //     billingInterval,
      //     businessId,
      //     cardDetails: {
      //       cardholderName,
      //       cardNumber: cardNumber.replace(/\s/g, ''),
      //       expiry,
      //       cvv,
      //     },
      //   }),
      // });
      //
      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.error || 'Payment failed');
      // }
      //
      // const { subscriptionId } = await response.json();

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For now, show success message
      // In production, Xendit webhook will update subscription_status to 'active'
      alert('Payment integration pending. Connect Xendit to process payments.');

      // Redirect to dashboard after successful payment
      // router.push('/dashboard?subscription=success');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Payment failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2 text-gray-400">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Payment Form */}
          <div className="order-2 lg:order-1">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 lg:p-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Complete your subscription
              </h1>
              <p className="text-gray-400 mb-8">
                {plan.name} plan •{' '}
                {billingInterval === 'monthly' ? 'Monthly' : 'Annual'} billing
              </p>

              {/* Billing Toggle */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Billing Period
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingInterval('monthly')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      billingInterval === 'monthly'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">Monthly</span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          billingInterval === 'monthly'
                            ? 'border-cyan-500 bg-cyan-500'
                            : 'border-gray-600'
                        }`}
                      >
                        {billingInterval === 'monthly' && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">
                      ₱{plan.monthly.toLocaleString()}/month
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingInterval('yearly')}
                    className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                      billingInterval === 'yearly'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <span className="absolute -top-2 right-3 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                      Save {plan.yearlySavings}%
                    </span>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">Yearly</span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          billingInterval === 'yearly'
                            ? 'border-cyan-500 bg-cyan-500'
                            : 'border-gray-600'
                        }`}
                      >
                        {billingInterval === 'yearly' && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">
                      ₱{plan.yearly.toLocaleString()}/year
                    </span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Payment Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Payment Method
                  </label>
                  <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-cyan-500 bg-cyan-500/10">
                    <CreditCard className="w-6 h-6 text-cyan-400" />
                    <span className="font-medium text-white">
                      Credit / Debit Card
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
                        alt="Visa"
                        className="h-6"
                      />
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                        alt="Mastercard"
                        className="h-6"
                      />
                    </div>
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label
                    htmlFor="cardholderName"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Cardholder Name
                  </label>
                  <input
                    id="cardholderName"
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label
                    htmlFor="cardNumber"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Card Number
                  </label>
                  <input
                    id="cardNumber"
                    type="text"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(formatCardNumber(e.target.value))
                    }
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expiry"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Expiry Date
                    </label>
                    <input
                      id="expiry"
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cvv"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      CVV
                    </label>
                    <input
                      id="cvv"
                      type="text"
                      value={cvv}
                      onChange={(e) =>
                        setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500/20"
                    disabled={isLoading}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-400">
                    I agree that NoxaLoyalty will charge my card in the amount
                    above now and on a recurring {billingInterval} basis until I
                    cancel. I can cancel anytime in my account settings.{' '}
                    <Link
                      href="/terms"
                      className="text-cyan-400 hover:underline"
                    >
                      Terms of Service
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ₱{price.toLocaleString()}
                      <Lock className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Secured by Xendit • 256-bit SSL encryption</span>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="order-1 lg:order-2">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 lg:p-8 lg:sticky lg:top-8">
              <h2 className="text-lg font-semibold text-white mb-6">
                Order Summary
              </h2>

              {/* Plan Info */}
              <div className="flex items-start gap-4 pb-6 border-b border-gray-800">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-400">
                    {billingInterval === 'monthly' ? 'Monthly' : 'Annual'}{' '}
                    subscription
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="py-6 border-b border-gray-800 space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="py-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">₱{price.toLocaleString()}</span>
                </div>

                {billingInterval === 'yearly' && savings > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">Savings</span>
                    <span className="text-green-400">
                      -₱{savings.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">
                      ₱{price.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-sm">
                      /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                </div>

                {billingInterval === 'yearly' && (
                  <p className="text-sm text-gray-500 text-center">
                    That's only ₱{monthlyEquivalent.toLocaleString()}/month
                  </p>
                )}
              </div>

              {/* Renewal Notice */}
              <div className="bg-gray-800/50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-400">
                  Your subscription will auto-renew on{' '}
                  <span className="text-white">
                    {new Date(
                      Date.now() +
                        (billingInterval === 'monthly' ? 30 : 365) *
                          24 *
                          60 *
                          60 *
                          1000,
                    ).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  . You will be charged ₱{price.toLocaleString()}/
                  {billingInterval === 'monthly' ? 'month' : 'year'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
