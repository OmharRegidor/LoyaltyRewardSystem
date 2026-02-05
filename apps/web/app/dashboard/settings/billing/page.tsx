// apps/web/app/dashboard/settings/billing/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Calendar,
  Check,
  AlertTriangle,
  Loader2,
  Zap,
  Crown,
  ChevronRight,
  X,
  Shield,
  Receipt,
  Ban,
  RotateCcw,
  Sparkles,
  Wallet,
  Smartphone,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  display: string;
  last4?: string;
  status: string;
}

// ============================================
// PLAN DATA
// ============================================

const PLANS: Record<string, {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  limits: {
    customers: number | null;
    branches: number | null;
    staffPerBranch: number | null;
  };
}> = {
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
      'Basic analytics',
    ],
    limits: {
      customers: 3000,
      branches: 3,
      staffPerBranch: 3,
    },
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
    ],
    limits: {
      customers: null,
      branches: null,
      staffPerBranch: null,
    },
  },
};

// ============================================
// PAYMENT FORM (for new subscriptions)
// ============================================

function PaymentForm({
  plan,
  interval,
  onSuccess,
  onCancel,
}: {
  plan: typeof PLANS.core;
  interval: 'monthly' | 'annual';
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash' | 'maya'>('card');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);

  // Check if test mode (no Xendit keys)
  const isTestMode = process.env.NEXT_PUBLIC_XENDIT_TEST_MODE === 'true' || 
                     !process.env.NEXT_PUBLIC_XENDIT_PUBLIC_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // In test mode, simulate payment success
      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
        
        // Call API to activate subscription in test mode
        const response = await fetch('/api/billing/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            interval,
            testMode: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to activate subscription');
        }

        onSuccess();
        return;
      }

      // Real Xendit payment flow
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          interval,
          paymentMethod,
          card: paymentMethod === 'card' ? {
            number: cardData.number.replace(/\s/g, ''),
            expiryMonth: cardData.expiry.split('/')[0],
            expiryYear: cardData.expiry.split('/')[1],
            cvv: cardData.cvv,
            name: cardData.name,
          } : undefined,
          billingDetails: {
            fullName: cardData.name,
            email: '', // Will be filled from user session
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      // If Xendit returns a payment URL, redirect to it
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

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

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100  rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Complete your subscription</h1>
          <p className="text-gray-600 ">
            {plan.displayName} plan • {interval === 'annual' ? 'Annual' : 'Monthly'} billing
          </p>
        </div>
      </div>

      {/* Test Mode Banner */}
      {isTestMode && (
        <div className="mb-6 p-4 bg-amber-50  border border-amber-200  rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 ">Test Mode</p>
              <p className="text-sm text-amber-700 ">
                Payments are simulated. No real charges will be made.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50  border border-red-200  rounded-xl text-red-700 ">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'gcash', label: 'GCash', icon: Wallet },
                  { id: 'maya', label: 'Maya', icon: Smartphone },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-primary bg-primary/5 '
                        : 'border-gray-200  hover:border-gray-300'
                    }`}
                  >
                    <method.icon className={`w-6 h-6 ${
                      paymentMethod === method.id ? 'text-primary' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      paymentMethod === method.id ? 'text-primary' : ''
                    }`}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Details */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300  bg-white  focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Card Number</label>
                  <input
                    type="text"
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                    required
                    maxLength={19}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300  bg-white  focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="4242 4242 4242 4242"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Expiry</label>
                    <input
                      type="text"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                      required
                      maxLength={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300  bg-white  focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CVV</label>
                    <input
                      type="text"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      required
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300  bg-white  focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* E-wallet Notice */}
            {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
              <div className="p-4 bg-primary/5  border border-primary/20  rounded-xl">
                <p className="text-sm text-primary/90 ">
                  You'll be redirected to {paymentMethod === 'gcash' ? 'GCash' : 'Maya'} to complete payment.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay {formatPrice(price)}
                  <Shield className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50  rounded-2xl p-6 sticky top-8">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 ">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                plan.id === 'enterprise'
                  ? 'bg-gradient-to-br from-secondary to-yellow-500'
                  : 'bg-gradient-to-br from-primary to-primary/70'
              }`}>
                {plan.id === 'enterprise' ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <Zap className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium">{plan.displayName}</p>
                <p className="text-sm text-gray-500">{interval === 'annual' ? 'Annual' : 'Monthly'}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {plan.features.slice(0, 3).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 ">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 ">Subtotal</span>
                <span>{formatPrice(price)}</span>
              </div>
              {interval === 'annual' && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Savings</span>
                  <span>-{formatPrice(plan.priceMonthly * 12 - plan.priceAnnual)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200 ">
                <span>Total</span>
                <span>{formatPrice(price)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
        <Shield className="w-4 h-4" />
        <span>Secured by Xendit • 256-bit SSL encryption</span>
      </div>
    </div>
  );
}

// ============================================
// CANCEL MODAL
// ============================================

function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  endDate,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  endDate: string;
  isLoading: boolean;
}) {
  const [step, setStep] = useState<'reason' | 'confirm'>('reason');
  const [reason, setReason] = useState('');

  const reasons = [
    { value: 'too_expensive', label: 'Too expensive' },
    { value: 'not_using', label: 'Not using enough' },
    { value: 'missing_features', label: 'Missing features' },
    { value: 'found_alternative', label: 'Found alternative' },
    { value: 'temporary_pause', label: 'Temporary pause' },
    { value: 'other', label: 'Other' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-white  rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 ">
          <h2 className="text-xl font-bold">
            {step === 'reason' ? 'Cancel Subscription' : 'Confirm'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100  rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {step === 'reason' ? (
            <div className="space-y-4">
              <p className="text-gray-600 ">
                Why are you canceling?
              </p>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${
                      reason === r.value
                        ? 'border-primary bg-primary/5 '
                        : 'border-gray-200 '
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => setStep('confirm')}
                disabled={!reason}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50  border border-amber-200  rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="text-sm text-amber-700 ">
                    <p className="font-medium">What happens:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Active until {endDate}</li>
                      <li>• Data preserved for 30 days</li>
                      <li>• Can resubscribe anytime</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('reason')}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-300  font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// REACTIVATE MODAL
// ============================================

function ReactivateModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white  rounded-2xl shadow-2xl p-6 text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Reactivate Subscription?</h2>
        <p className="text-gray-600  mb-6">
          Your subscription will continue normally.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300  font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                ...
              </>
            ) : (
              'Reactivate'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// BILLING CONTENT (Wrapped component)
// ============================================

function BillingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const success = searchParams.get('success');
  const planParam = searchParams.get('plan');
  const intervalParam = (searchParams.get('interval') as 'monthly' | 'annual') || 'monthly';

  const { subscription, isLoading, refetch } = useSubscription();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);
  const [isLoadingReactivate, setIsLoadingReactivate] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Check if user came from plan signup flow
  useEffect(() => {
    if (planParam && PLANS[planParam] && !subscription?.hasAccess) {
      setShowPaymentForm(true);
    }
  }, [planParam, subscription]);

  useEffect(() => {
    if (success === 'true') {
      setShowSuccess(true);
      setShowPaymentForm(false);
      refetch();
      window.history.replaceState({}, '', '/dashboard/settings/billing');
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [success, refetch]);

  useEffect(() => {
    if (subscription?.hasAccess && !subscription?.isFreeForever) {
      Promise.all([
        fetch('/api/billing/invoices').then((r) => r.json()),
        fetch('/api/billing/payment-method').then((r) => r.json()),
      ]).then(([inv, pm]) => {
        setInvoices(inv.invoices || []);
        setPaymentMethod(pm.paymentMethod || null);
      });
    }
  }, [subscription]);

  const handleCancel = async () => {
    setIsLoadingCancel(true);
    try {
      await fetch('/api/billing/cancel', { method: 'POST' });
      await refetch();
      setShowCancelModal(false);
    } finally {
      setIsLoadingCancel(false);
    }
  };

  const handleReactivate = async () => {
    setIsLoadingReactivate(true);
    try {
      await fetch('/api/billing/reactivate', { method: 'POST' });
      await refetch();
      setShowReactivateModal(false);
    } finally {
      setIsLoadingReactivate(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setShowSuccess(true);
    refetch();
    router.replace('/dashboard/settings/billing?success=true');
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    router.replace('/dashboard/settings/billing');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const formatPrice = (c: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(c / 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show payment form if user came from plan signup
  if (showPaymentForm && planParam && PLANS[planParam]) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <PaymentForm
          plan={PLANS[planParam]}
          interval={intervalParam}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600  mt-1">
          Manage your subscription and payments
        </p>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-50  border border-green-200  rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-green-100  rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800 ">
                Subscription activated!
              </p>
              <p className="text-sm text-green-700 ">
                Your card will be auto-charged each billing cycle.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Plan */}
      <div className="bg-white  rounded-2xl border border-gray-200 ">
        <div className="p-6 border-b border-gray-200 ">
          <h2 className="text-lg font-semibold">Current Plan</h2>
        </div>
        <div className="p-6">
          {subscription?.status === 'preview' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100  rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No Active Subscription
              </h3>
              <p className="text-gray-600  mb-6">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
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
                      {subscription.status === 'active' &&
                        !subscription.cancelAtPeriodEnd && (
                          <span className="bg-green-100  text-green-700  text-xs font-medium px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      {subscription.cancelAtPeriodEnd && (
                        <span className="bg-amber-100  text-amber-700  text-xs font-medium px-2 py-1 rounded-full">
                          Canceling
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 ">
                      {subscription.isFreeForever
                        ? 'Unlimited access'
                        : `Auto-renews ${
                            subscription.billingInterval === 'annual'
                              ? 'annually'
                              : 'monthly'
                          }`}
                    </p>
                  </div>
                </div>
              </div>

              {subscription.currentPeriodEnd && !subscription.isFreeForever && (
                <div className="flex items-center gap-3 p-4 bg-gray-50  rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-700 ">
                    {subscription.cancelAtPeriodEnd
                      ? 'Ends on '
                      : 'Next renewal: '}
                    <span className="font-medium">
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Method */}
      {subscription?.hasAccess && !subscription?.isFreeForever && (
        <div className="bg-white  rounded-2xl border border-gray-200 ">
          <div className="p-6 border-b border-gray-200  flex items-center justify-between">
            <h2 className="text-lg font-semibold">Payment Method</h2>
          </div>
          <div className="p-6">
            {paymentMethod ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gray-100  rounded-lg flex items-center justify-center">
                  {paymentMethod.type === 'card' ? (
                    <CreditCard className="w-6 h-6 text-gray-600" />
                  ) : paymentMethod.type === 'ewallet' ? (
                    <Wallet className="w-6 h-6 text-gray-600" />
                  ) : (
                    <Smartphone className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{paymentMethod.display}</p>
                  <p className="text-sm text-gray-500">
                    {paymentMethod.status}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No payment method on file</p>
            )}
          </div>
        </div>
      )}

      {/* Billing History */}
      {subscription?.hasAccess &&
        !subscription?.isFreeForever &&
        invoices.length > 0 && (
          <div className="bg-white  rounded-2xl border border-gray-200 ">
            <div className="p-6 border-b border-gray-200 ">
              <h2 className="text-lg font-semibold">Billing History</h2>
            </div>
            <div className="divide-y divide-gray-200 ">
              {invoices.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{inv.number}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(inv.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        inv.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <span className="font-medium">
                      {formatPrice(inv.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Actions */}
      {subscription?.hasAccess && !subscription?.isFreeForever && (
        <div className="bg-white  rounded-2xl border border-gray-200 ">
          <div className="p-6 border-b border-gray-200 ">
            <h2 className="text-lg font-semibold">Manage Subscription</h2>
          </div>
          <div className="divide-y divide-gray-200 ">
            {subscription.cancelAtPeriodEnd ? (
              <button
                onClick={() => setShowReactivateModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 "
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">
                    Reactivate subscription
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ) : (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 "
              >
                <div className="flex items-center gap-3">
                  <Ban className="w-5 h-5 text-red-500" />
                  <span className="text-red-600">Cancel subscription</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Security */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pb-8">
        <Shield className="w-4 h-4" />
        <span>Secured by Xendit • 256-bit SSL encryption</span>
      </div>

      {/* Modals */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        endDate={
          subscription?.currentPeriodEnd
            ? formatDate(subscription.currentPeriodEnd)
            : ''
        }
        isLoading={isLoadingCancel}
      />
      <ReactivateModal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        onConfirm={handleReactivate}
        isLoading={isLoadingReactivate}
      />
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
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}