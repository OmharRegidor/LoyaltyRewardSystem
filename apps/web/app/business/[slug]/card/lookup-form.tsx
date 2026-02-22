// apps/web/app/business/[slug]/card/lookup-form.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, Search, ShieldCheck, ArrowLeft } from 'lucide-react';
import { CardModal } from './card-modal';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const PhoneLookupSchema = z.object({
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
});

const OtpSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

type PhoneLookupInput = z.infer<typeof PhoneLookupSchema>;
type OtpInput = z.infer<typeof OtpSchema>;

// ============================================
// TYPES
// ============================================

interface LookupFormProps {
  businessSlug: string;
  businessName: string;
}

interface CardData {
  customerName: string;
  phone: string;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
}

type Step = 'idle' | 'otp_sent' | 'verified';

// ============================================
// COMPONENT
// ============================================

export function LookupForm({ businessSlug, businessName }: LookupFormProps) {
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const phoneForm = useForm<PhoneLookupInput>({
    resolver: zodResolver(PhoneLookupSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<OtpInput>({
    resolver: zodResolver(OtpSchema),
    defaultValues: { code: '' },
  });

  // ============================================
  // STEP 1: Submit phone — send OTP
  // ============================================

  const onPhoneSubmit = async (data: PhoneLookupInput) => {
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
        setError(json.error || 'Something went wrong. Please try again.');
        return;
      }

      if (!json.success) {
        // Customer not found or no email
        setError(json.message || 'No card found for this phone number.');
        return;
      }

      // OTP sent successfully
      setPhone(data.phone);
      setMaskedEmail(json.maskedEmail || null);
      setStep('otp_sent');
      startResendCooldown();
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // STEP 2: Verify OTP — get card data
  // ============================================

  const onOtpSubmit = async (data: OtpInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/business/${businessSlug}/lookup/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: data.code }),
      });

      const json = await response.json();

      if (!response.ok) {
        const msg = json.error || 'Invalid verification code.';
        const remaining = json.attemptsRemaining;
        setError(
          remaining !== undefined
            ? `${msg} ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : msg
        );
        return;
      }

      // Success — show card
      setCardData({
        customerName: json.data.customerName,
        phone,
        qrCodeUrl: json.data.qrCodeUrl,
        tier: json.data.tier,
        totalPoints: json.data.totalPoints,
      });
      setStep('verified');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RESEND CODE
  // ============================================

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    try {
      const response = await fetch(`/api/public/business/${businessSlug}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Failed to resend code.');
        return;
      }

      if (!json.success) {
        setError(json.message || 'Failed to resend code.');
        return;
      }

      startResendCooldown();
    } catch {
      setError('Network error.');
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ============================================
  // BACK TO PHONE STEP
  // ============================================

  const handleBack = () => {
    setStep('idle');
    setError(null);
    setMaskedEmail(null);
    otpForm.reset();
  };

  const handleCloseModal = () => {
    setCardData(null);
    setStep('idle');
    setError(null);
    setMaskedEmail(null);
    setPhone('');
    phoneForm.reset();
    otpForm.reset();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      {/* STEP 1: Phone Input */}
      {step === 'idle' && (
        <form
          onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
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

          <div className="mb-6">
            <label
              htmlFor="lookupPhone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              {...phoneForm.register('phone')}
              type="tel"
              inputMode="numeric"
              maxLength={11}
              id="lookupPhone"
              placeholder="09171234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (
                  ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)
                )
                  return;
                if (!/^\d$/.test(e.key)) e.preventDefault();
              }}
            />
            {phoneForm.formState.errors.phone && (
              <p className="mt-1 text-sm text-red-500">
                {phoneForm.formState.errors.phone.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the phone number you used to sign up
            </p>
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
        </form>
      )}

      {/* STEP 2: OTP Input */}
      {step === 'otp_sent' && (
        <form
          onSubmit={otpForm.handleSubmit(onOtpSubmit)}
          className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-t-secondary border border-gray-100"
        >
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">Verify Your Identity</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            We sent a 6-digit code to{' '}
            <strong className="text-gray-700">{maskedEmail}</strong>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <input
              {...otpForm.register('code')}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              autoComplete="one-time-code"
              disabled={isSubmitting}
              className="w-full py-4 text-center text-3xl font-mono font-bold tracking-[0.5em] border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              onKeyDown={(e) => {
                if (
                  ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)
                )
                  return;
                if (!/^\d$/.test(e.key)) e.preventDefault();
              }}
            />
            {otpForm.formState.errors.code && (
              <p className="mt-1 text-xs text-red-500 text-center">
                {otpForm.formState.errors.code.message}
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
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Verify & View Card
              </>
            )}
          </button>

          {/* Resend */}
          <div className="mt-4 text-center">
            {resendCooldown > 0 ? (
              <p className="text-xs text-gray-400">
                Resend code in {resendCooldown}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-xs text-primary hover:underline"
              >
                Didn&apos;t receive the code? Resend
              </button>
            )}
          </div>
        </form>
      )}

      {/* Card Modal */}
      {cardData && (
        <CardModal
          isOpen={true}
          onClose={handleCloseModal}
          customerName={cardData.customerName}
          businessName={businessName}
          phone={cardData.phone}
          qrCodeUrl={cardData.qrCodeUrl}
          tier={cardData.tier}
          totalPoints={cardData.totalPoints}
        />
      )}
    </>
  );
}
