// apps/web/components/billing/EmbeddedCheckout.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Lock,
  Loader2,
  AlertCircle,
  ChevronDown,
  Shield,
  Info,
  Smartphone,
  Wallet,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Plan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceAnnual: number;
}

interface EmbeddedCheckoutProps {
  plan: Plan;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type PaymentMethodType = 'card' | 'gcash' | 'maya';

interface BillingFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethodType;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  agreedToTerms: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const PAYMENT_METHODS = [
  {
    id: 'card' as const,
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, JCB',
  },
  {
    id: 'gcash' as const,
    name: 'GCash',
    icon: Wallet,
    description: 'Pay with GCash',
  },
  {
    id: 'maya' as const,
    name: 'Maya',
    icon: Smartphone,
    description: 'Pay with Maya',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPrice(centavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(centavos / 100);
}

function formatCardNumber(value: string): string {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const parts = [];
  for (let i = 0, len = Math.min(v.length, 16); i < len; i += 4) {
    parts.push(v.substring(i, i + 4));
  }
  return parts.join(' ');
}

function formatExpiryDate(value: string): string {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    return v.substring(0, 2) + ' / ' + v.substring(2, 4);
  }
  return v;
}

function detectCardType(number: string): string | null {
  const clean = number.replace(/\s/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
  if (/^35/.test(clean)) return 'jcb';
  return null;
}

function getNextRenewalDate(interval: 'monthly' | 'annual'): string {
  const date = new Date();
  if (interval === 'annual') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toLocaleDateString('en-PH', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================
// COMPONENT
// ============================================

export function EmbeddedCheckout({
  plan,
  onSuccess,
  onCancel,
}: EmbeddedCheckoutProps) {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>(
    'annual',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<BillingFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    agreedToTerms: false,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const monthlyPrice = plan.priceMonthly;
  const annualPrice = plan.priceAnnual;
  const selectedPrice =
    billingInterval === 'annual' ? annualPrice : monthlyPrice;
  const annualSavings = Math.round(
    ((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100,
  );

  const cardType = detectCardType(formData.cardNumber);

  const handleInputChange = (
    field: keyof BillingFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'fullName':
        return !value.trim() ? 'Full name is required' : null;
      case 'email':
        return !value.trim()
          ? 'Email is required'
          : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? 'Invalid email'
            : null;
      case 'phone':
        return !value.trim() ? 'Phone is required' : null;
      case 'cardNumber':
        if (formData.paymentMethod !== 'card') return null;
        const clean = value.replace(/\s/g, '');
        return !clean
          ? 'Card number is required'
          : clean.length < 13
            ? 'Invalid card number'
            : null;
      case 'expiryDate':
        if (formData.paymentMethod !== 'card') return null;
        return !value ? 'Expiry is required' : null;
      case 'cvc':
        if (formData.paymentMethod !== 'card') return null;
        return !value
          ? 'CVC is required'
          : value.length < 3
            ? 'Invalid CVC'
            : null;
      default:
        return null;
    }
  };

  const getFieldError = (field: string): string | null => {
    if (!touched[field]) return null;
    return validateField(
      field,
      formData[field as keyof BillingFormData] as string,
    );
  };

  const isFormValid = (): boolean => {
    const baseFields = ['fullName', 'email', 'phone'];
    const cardFields =
      formData.paymentMethod === 'card'
        ? ['cardNumber', 'expiryDate', 'cvc']
        : [];
    const allFields = [...baseFields, ...cardFields];
    return (
      allFields.every(
        (f) =>
          !validateField(f, formData[f as keyof BillingFormData] as string),
      ) && formData.agreedToTerms
    );
  };

  const handleSubmit = async () => {
    const allFields = [
      'fullName',
      'email',
      'phone',
      'cardNumber',
      'expiryDate',
      'cvc',
    ];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach((f) => {
      newTouched[f] = true;
    });
    setTouched((prev) => ({ ...prev, ...newTouched }));

    if (!isFormValid()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [expiryMonth, expiryYear] = formData.expiryDate
        .replace(/\s/g, '')
        .split('/');

      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          interval: billingInterval,
          paymentMethod: formData.paymentMethod,
          card:
            formData.paymentMethod === 'card'
              ? {
                  number: formData.cardNumber,
                  expiryMonth,
                  expiryYear: '20' + expiryYear,
                  cvv: formData.cvc,
                  name: formData.fullName,
                }
              : undefined,
          billingDetails: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        onSuccess?.();
        router.push('/dashboard/settings/billing?success=true');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {plan.displayName} plan
          </h1>
        </div>

        {/* Billing Interval Toggle */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
              billingInterval === 'monthly'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  billingInterval === 'monthly'
                    ? 'border-blue-500'
                    : 'border-gray-500'
                }`}
              >
                {billingInterval === 'monthly' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                )}
              </div>
              <span className="font-semibold text-white">Monthly</span>
            </div>
            <p className="text-gray-400 text-sm ml-8">
              {formatPrice(monthlyPrice)}/month + tax
            </p>
          </button>

          <button
            onClick={() => setBillingInterval('annual')}
            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
              billingInterval === 'annual'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="absolute -top-3 right-3">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                Save {annualSavings}%
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  billingInterval === 'annual'
                    ? 'border-blue-500'
                    : 'border-gray-500'
                }`}
              >
                {billingInterval === 'annual' && (
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                )}
              </div>
              <span className="font-semibold text-white">Yearly</span>
            </div>
            <p className="text-gray-400 text-sm ml-8">
              {formatPrice(annualPrice)}/year + tax
            </p>
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-[#16162a] rounded-xl p-6 mb-8 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">
            Order details
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-white">
                  {plan.displayName} plan
                </p>
                <p className="text-sm text-gray-400">
                  {billingInterval === 'annual' ? 'Annually' : 'Monthly'}
                </p>
              </div>
              <p className="font-medium text-white">
                {formatPrice(selectedPrice)}
              </p>
            </div>
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-white">Total due today</p>
                <p className="font-semibold text-white">
                  {formatPrice(selectedPrice)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-renewal Notice */}
        <div className="flex items-start gap-3 p-4 bg-[#16162a] rounded-xl mb-8 border border-gray-800">
          <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            Your subscription will auto renew on{' '}
            {getNextRenewalDate(billingInterval)}. You will be charged{' '}
            {formatPrice(selectedPrice)}/
            {billingInterval === 'annual' ? 'year' : 'month'} + tax.
          </p>
        </div>

        {/* Payment Form */}
        <div className="bg-[#16162a] rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-6">
            Payment method
          </h2>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select payment method
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => handleInputChange('paymentMethod', pm.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      formData.paymentMethod === pm.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <pm.icon
                      className={`w-6 h-6 mx-auto mb-2 ${
                        formData.paymentMethod === pm.id
                          ? 'text-blue-400'
                          : 'text-gray-400'
                      }`}
                    />
                    <p className="font-medium text-white text-sm">{pm.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pm.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                placeholder="Juan dela Cruz"
                className={`w-full px-4 py-3 rounded-lg bg-[#0d0d1a] border ${
                  getFieldError('fullName')
                    ? 'border-red-500'
                    : 'border-gray-700 focus:border-blue-500'
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
              />
              {getFieldError('fullName') && (
                <p className="mt-1 text-sm text-red-400">
                  {getFieldError('fullName')}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="juan@business.com"
                className={`w-full px-4 py-3 rounded-lg bg-[#0d0d1a] border ${
                  getFieldError('email')
                    ? 'border-red-500'
                    : 'border-gray-700 focus:border-blue-500'
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
              />
              {getFieldError('email') && (
                <p className="mt-1 text-sm text-red-400">
                  {getFieldError('email')}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="+63 917 123 4567"
                className={`w-full px-4 py-3 rounded-lg bg-[#0d0d1a] border ${
                  getFieldError('phone')
                    ? 'border-red-500'
                    : 'border-gray-700 focus:border-blue-500'
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
              />
              {getFieldError('phone') && (
                <p className="mt-1 text-sm text-red-400">
                  {getFieldError('phone')}
                </p>
              )}
            </div>

            {/* Card Details - Only show if card selected */}
            {formData.paymentMethod === 'card' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Card number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) =>
                        handleInputChange(
                          'cardNumber',
                          formatCardNumber(e.target.value),
                        )
                      }
                      onBlur={() => handleBlur('cardNumber')}
                      placeholder="1234 1234 1234 1234"
                      maxLength={19}
                      className={`w-full px-4 py-3 pr-24 rounded-lg bg-[#0d0d1a] border ${
                        getFieldError('cardNumber')
                          ? 'border-red-500'
                          : 'border-gray-700 focus:border-blue-500'
                      } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <div
                        className={`w-8 h-5 rounded ${cardType === 'visa' ? 'opacity-100' : 'opacity-40'}`}
                      >
                        <svg viewBox="0 0 38 24" className="w-full h-full">
                          <rect fill="#1A1F71" width="38" height="24" rx="3" />
                          <text
                            x="19"
                            y="15"
                            textAnchor="middle"
                            fill="white"
                            fontSize="8"
                            fontWeight="bold"
                          >
                            VISA
                          </text>
                        </svg>
                      </div>
                      <div
                        className={`w-8 h-5 rounded ${cardType === 'mastercard' ? 'opacity-100' : 'opacity-40'}`}
                      >
                        <svg viewBox="0 0 38 24" className="w-full h-full">
                          <circle cx="13" cy="12" r="9" fill="#EB001B" />
                          <circle cx="25" cy="12" r="9" fill="#F79E1B" />
                        </svg>
                      </div>
                      <div
                        className={`w-8 h-5 rounded ${cardType === 'jcb' ? 'opacity-100' : 'opacity-40'}`}
                      >
                        <svg viewBox="0 0 38 24" className="w-full h-full">
                          <rect fill="#0B4EA2" width="38" height="24" rx="3" />
                          <text
                            x="19"
                            y="15"
                            textAnchor="middle"
                            fill="white"
                            fontSize="8"
                            fontWeight="bold"
                          >
                            JCB
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>
                  {getFieldError('cardNumber') && (
                    <p className="mt-1 text-sm text-red-400">
                      {getFieldError('cardNumber')}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expiration date
                    </label>
                    <input
                      type="text"
                      value={formData.expiryDate}
                      onChange={(e) =>
                        handleInputChange(
                          'expiryDate',
                          formatExpiryDate(e.target.value),
                        )
                      }
                      onBlur={() => handleBlur('expiryDate')}
                      placeholder="MM / YY"
                      maxLength={7}
                      className={`w-full px-4 py-3 rounded-lg bg-[#0d0d1a] border ${
                        getFieldError('expiryDate')
                          ? 'border-red-500'
                          : 'border-gray-700 focus:border-blue-500'
                      } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono`}
                    />
                    {getFieldError('expiryDate') && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldError('expiryDate')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CVC
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.cvc}
                        onChange={(e) =>
                          handleInputChange(
                            'cvc',
                            e.target.value.replace(/\D/g, '').slice(0, 4),
                          )
                        }
                        onBlur={() => handleBlur('cvc')}
                        placeholder="123"
                        maxLength={4}
                        className={`w-full px-4 py-3 pr-12 rounded-lg bg-[#0d0d1a] border ${
                          getFieldError('cvc')
                            ? 'border-red-500'
                            : 'border-gray-700 focus:border-blue-500'
                        } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono`}
                      />
                      <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    </div>
                    {getFieldError('cvc') && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldError('cvc')}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* E-wallet info */}
            {(formData.paymentMethod === 'gcash' ||
              formData.paymentMethod === 'maya') && (
              <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                <p className="text-sm text-blue-300">
                  You will be redirected to{' '}
                  {formData.paymentMethod === 'gcash' ? 'GCash' : 'Maya'} to
                  authorize the recurring payment. Make sure you have sufficient
                  balance for auto-debit.
                </p>
              </div>
            )}

            {/* Terms Agreement */}
            <div className="pt-4 border-t border-gray-700">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) =>
                    handleInputChange('agreedToTerms', e.target.checked)
                  }
                  className="w-5 h-5 mt-0.5 rounded border-2 border-gray-600 bg-transparent text-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer shrink-0"
                />
                <span className="text-sm text-gray-400 leading-relaxed">
                  You agree that NoxaLoyalty will charge your{' '}
                  {formData.paymentMethod === 'card' ? 'card' : 'e-wallet'} in
                  the amount above now and on a recurring {billingInterval}{' '}
                  basis until you cancel in accordance with our{' '}
                  <a
                    href="/terms"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    terms
                  </a>
                  . You can cancel at any time in your account settings.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!formData.agreedToTerms || isLoading}
              className={`w-full py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                formData.agreedToTerms && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Subscribe
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Secured by Xendit • 256-bit SSL encryption</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onCancel || (() => router.back())}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel and go back
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmbeddedCheckout;
