// apps/web/app/business/[slug]/card/lookup-form.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, Search, Lock, ShieldCheck, ArrowLeft, KeyRound, Info } from 'lucide-react';
import { CardModal } from './card-modal';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const PinLookupSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Phone number or email is required')
    .refine(
      (val) => {
        const trimmed = val.trim();
        // Email
        if (trimmed.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
        // Phone (11 digits)
        return /^\d{11}$/.test(trimmed.replace(/\s+/g, ''));
      },
      { message: 'Enter a valid 11-digit phone number or email address' }
    ),
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d+$/, 'PIN must contain only digits'),
});

const PinResetRequestSchema = z.object({
  phone: z
    .string()
    .regex(/^\d{11}$/, 'Phone number must be exactly 11 digits')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
});

const PinResetVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
  newPin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d+$/, 'PIN must contain only digits'),
  confirmPin: z.string(),
}).refine((data) => data.newPin === data.confirmPin, {
  message: 'PINs do not match',
  path: ['confirmPin'],
});

type PinLookupInput = z.infer<typeof PinLookupSchema>;
type PinResetRequestInput = z.infer<typeof PinResetRequestSchema>;
type PinResetVerifyInput = z.infer<typeof PinResetVerifySchema>;

// ============================================
// TYPES
// ============================================

interface LookupFormProps {
  businessSlug: string;
  businessName: string;
}

interface CardData {
  customerName: string;
  phone: string | null;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
}

type Step = 'lookup' | 'pin_setup_prompt' | 'reset_request' | 'reset_verify';

// ============================================
// COMPONENT
// ============================================

export function LookupForm({ businessSlug, businessName }: LookupFormProps) {
  const [step, setStep] = useState<Step>('lookup');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [lookupWasEmail, setLookupWasEmail] = useState(false);

  const lookupForm = useForm<PinLookupInput>({
    resolver: zodResolver(PinLookupSchema),
    defaultValues: { identifier: '', pin: '' },
  });

  const resetRequestForm = useForm<PinResetRequestInput>({
    resolver: zodResolver(PinResetRequestSchema),
    defaultValues: { phone: '', email: '' },
  });

  const resetVerifyForm = useForm<PinResetVerifyInput>({
    resolver: zodResolver(PinResetVerifySchema),
    defaultValues: { code: '', newPin: '', confirmPin: '' },
  });

  // ============================================
  // LOOKUP: Phone + PIN
  // ============================================

  const onLookupSubmit = async (data: PinLookupInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/business/${businessSlug}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok) {
        const msg = json.error || 'Something went wrong. Please try again.';
        const remaining = json.attemptsRemaining;
        setError(
          remaining !== undefined
            ? `${msg} ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : msg
        );
        return;
      }

      // Existing customer without PIN
      if (json.needsPinSetup) {
        setLookupWasEmail(data.identifier.includes('@'));
        setStep('pin_setup_prompt');
        return;
      }

      setCardData({
        customerName: json.data.customerName,
        phone: json.data.phone || null,
        qrCodeUrl: json.data.qrCodeUrl,
        tier: json.data.tier,
        totalPoints: json.data.totalPoints,
      });
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // PIN RESET: Request OTP
  // ============================================

  const onResetRequest = async (data: PinResetRequestInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: { email: string; phone?: string } = { email: data.email };
      if (data.phone) payload.phone = data.phone;

      const response = await fetch(`/api/public/business/${businessSlug}/pin-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Something went wrong. Please try again.');
        return;
      }

      setResetEmail(data.email);
      setStep('reset_verify');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // PIN RESET: Verify OTP + Set New PIN
  // ============================================

  const onResetVerify = async (data: PinResetVerifyInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/business/${businessSlug}/pin-reset/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          code: data.code,
          newPin: data.newPin,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Failed to reset PIN. Please try again.');
        return;
      }

      setSuccess('PIN updated successfully! You can now view your card.');
      setStep('lookup');
      resetVerifyForm.reset();
      resetRequestForm.reset();
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // NAVIGATION
  // ============================================

  const goToForgotPin = () => {
    setStep('reset_request');
    setError(null);
    setSuccess(null);
  };

  const goToLookup = () => {
    setStep('lookup');
    setError(null);
    setSuccess(null);
    resetRequestForm.reset();
    resetVerifyForm.reset();
  };

  const handleCloseModal = () => {
    setCardData(null);
    setError(null);
    lookupForm.reset();
  };

  const digitOnlyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* LOOKUP: Phone + PIN */}
      {step === 'lookup' && !cardData && (
        <form
          onSubmit={lookupForm.handleSubmit(onLookupSubmit)}
          className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-t-secondary border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">View My Card</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Phone or Email */}
          <div className="mb-4">
            <label htmlFor="lookupIdentifier" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number or Email
            </label>
            <input
              {...lookupForm.register('identifier')}
              type="text"
              id="lookupIdentifier"
              placeholder="09171234567 or juan@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isSubmitting}
            />
            {lookupForm.formState.errors.identifier && (
              <p className="mt-1 text-sm text-red-500">
                {lookupForm.formState.errors.identifier.message}
              </p>
            )}
          </div>

          {/* PIN */}
          <div className="mb-6">
            <label htmlFor="lookupPin" className="block text-sm font-medium text-gray-700 mb-1">
              4-Digit PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...lookupForm.register('pin')}
                type="password"
                inputMode="numeric"
                maxLength={4}
                id="lookupPin"
                placeholder="••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                disabled={isSubmitting}
                onKeyDown={digitOnlyKeyDown}
              />
            </div>
            {lookupForm.formState.errors.pin && (
              <p className="mt-1 text-sm text-red-500">
                {lookupForm.formState.errors.pin.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Looking up...
              </>
            ) : (
              'View My Card'
            )}
          </button>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={goToForgotPin}
              className="text-xs text-primary hover:underline"
            >
              Forgot PIN?
            </button>
          </div>
        </form>
      )}

      {/* PIN SETUP PROMPT: For existing customers without PIN */}
      {step === 'pin_setup_prompt' && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-t-secondary border border-gray-100">
          <button
            type="button"
            onClick={goToLookup}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Set Up Your PIN</h2>
          </div>

          <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              We&apos;ve upgraded to a faster, more secure way to view your card — no more email codes!
            </p>
            <p className="text-sm text-blue-700">
              Set a 4-digit PIN now and you&apos;ll be able to view your card instantly using just your phone number and PIN.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              // Pre-fill phone from lookup form
              const id = lookupForm.getValues('identifier');
              if (id && id.includes('@')) {
                resetRequestForm.setValue('email', id.trim());
              } else if (id && /^\d+$/.test(id.replace(/\s+/g, ''))) {
                resetRequestForm.setValue('phone', id.replace(/\s+/g, ''));
              }
              setStep('reset_request');
              setError(null);
            }}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Set My PIN
          </button>
        </div>
      )}

      {/* PIN RESET: Request */}
      {step === 'reset_request' && (
        <form
          onSubmit={resetRequestForm.handleSubmit(onResetRequest)}
          className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-t-secondary border border-gray-100"
        >
          <button
            type="button"
            onClick={goToLookup}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Reset PIN</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            {lookupWasEmail
              ? 'We\u2019ll send a verification code to your email so you can set your PIN.'
              : 'Enter your phone number and the email you used to sign up. We\u2019ll send a verification code to your email.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Phone - hidden when lookup was by email */}
          {!lookupWasEmail && (
            <div className="mb-4">
              <label htmlFor="resetPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                {...resetRequestForm.register('phone')}
                type="tel"
                inputMode="numeric"
                maxLength={11}
                id="resetPhone"
                placeholder="09171234567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                disabled={isSubmitting}
                onKeyDown={digitOnlyKeyDown}
              />
              {resetRequestForm.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-500">
                  {resetRequestForm.formState.errors.phone.message}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div className="mb-6">
            <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...resetRequestForm.register('email')}
              type="email"
              id="resetEmail"
              placeholder="juan@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isSubmitting}
            />
            {resetRequestForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {resetRequestForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending code...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </form>
      )}

      {/* PIN RESET: Verify + New PIN */}
      {step === 'reset_verify' && (
        <form
          onSubmit={resetVerifyForm.handleSubmit(onResetVerify)}
          className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-t-secondary border border-gray-100"
        >
          <button
            type="button"
            onClick={() => { setStep('reset_request'); setError(null); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Set New PIN</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Enter the 6-digit code sent to your email and choose a new 4-digit PIN.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* OTP Code */}
          <div className="mb-4">
            <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              {...resetVerifyForm.register('code')}
              type="text"
              inputMode="numeric"
              maxLength={6}
              id="resetCode"
              placeholder="000000"
              autoComplete="one-time-code"
              className="w-full py-3 text-center text-2xl font-mono font-bold tracking-[0.4em] border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isSubmitting}
              onKeyDown={digitOnlyKeyDown}
            />
            {resetVerifyForm.formState.errors.code && (
              <p className="mt-1 text-sm text-red-500 text-center">
                {resetVerifyForm.formState.errors.code.message}
              </p>
            )}
          </div>

          {/* New PIN */}
          <div className="mb-4">
            <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-1">
              New 4-Digit PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...resetVerifyForm.register('newPin')}
                type="password"
                inputMode="numeric"
                maxLength={4}
                id="newPin"
                placeholder="••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                disabled={isSubmitting}
                onKeyDown={digitOnlyKeyDown}
              />
            </div>
            {resetVerifyForm.formState.errors.newPin && (
              <p className="mt-1 text-sm text-red-500">
                {resetVerifyForm.formState.errors.newPin.message}
              </p>
            )}
          </div>

          {/* Confirm PIN */}
          <div className="mb-6">
            <label htmlFor="confirmNewPin" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...resetVerifyForm.register('confirmPin')}
                type="password"
                inputMode="numeric"
                maxLength={4}
                id="confirmNewPin"
                placeholder="••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                disabled={isSubmitting}
                onKeyDown={digitOnlyKeyDown}
              />
            </div>
            {resetVerifyForm.formState.errors.confirmPin && (
              <p className="mt-1 text-sm text-red-500">
                {resetVerifyForm.formState.errors.confirmPin.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting PIN...
              </>
            ) : (
              'Set New PIN'
            )}
          </button>
        </form>
      )}

      {/* Card Modal */}
      {cardData && (
        <CardModal
          isOpen={true}
          onClose={handleCloseModal}
          customerName={cardData.customerName}
          businessName={businessName}
          phone={cardData.phone || undefined}
          qrCodeUrl={cardData.qrCodeUrl}
          tier={cardData.tier}
          totalPoints={cardData.totalPoints}
        />
      )}
    </>
  );
}
