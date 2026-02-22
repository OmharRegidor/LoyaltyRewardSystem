// apps/web/app/join/[code]/join-page-client.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Star,
  Gift,
  CreditCard,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { CardModal } from '@/app/business/[slug]/card/card-modal';

// ============================================
// SCHEMAS
// ============================================

const Step1Schema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  referralCode: z.string().max(10).optional(),
});

const Step2Schema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

type Step1Input = z.infer<typeof Step1Schema>;
type Step2Input = z.infer<typeof Step2Schema>;

// ============================================
// TYPES
// ============================================

interface JoinPageClientProps {
  joinCode: string;
  businessName: string;
  businessLogo: string | null;
  pointsPerPurchase: number | null;
  pesosPerPoint: number | null;
  prefillEmail: string;
}

type Step = 'info' | 'verify' | 'success';

interface CardData {
  customerName: string;
  phone: string;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
}

// ============================================
// COMPONENT
// ============================================

export function JoinPageClient({
  joinCode,
  businessName,
  businessLogo,
  pointsPerPurchase,
  pesosPerPoint,
  prefillEmail,
}: JoinPageClientProps) {
  const [step, setStep] = useState<Step>('info');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Step1Input | null>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 1 form
  const step1Form = useForm<Step1Input>({
    resolver: zodResolver(Step1Schema),
    defaultValues: {
      fullName: '',
      email: prefillEmail,
      phone: '',
      referralCode: '',
    },
  });

  // Step 2 form
  const step2Form = useForm<Step2Input>({
    resolver: zodResolver(Step2Schema),
    defaultValues: { code: '' },
  });

  // ============================================
  // STEP 1: Submit info + send OTP
  // ============================================

  const onStep1Submit = async (data: Step1Input) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/public/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          joinCode,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Failed to send verification code');
        return;
      }

      setFormData(data);
      setStep('verify');
      startResendCooldown();
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // STEP 2: Verify OTP
  // ============================================

  const onStep2Submit = async (data: Step2Input) => {
    if (!formData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Verify the code
      const verifyResponse = await fetch('/api/public/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.code,
          email: formData.email,
          joinCode,
        }),
      });

      const verifyJson = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyJson.message || verifyJson.error || 'Invalid code');
        return;
      }

      // Create customer
      const signupResponse = await fetch(`/api/public/join/${joinCode}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          referralCode: formData.referralCode,
        }),
      });

      const signupJson = await signupResponse.json();

      if (!signupResponse.ok) {
        setError(signupJson.error || 'Failed to create account');
        return;
      }

      // Success!
      setCardData({
        customerName: signupJson.data.customerName,
        phone: formData.phone,
        qrCodeUrl: signupJson.data.qrCodeUrl,
        tier: signupJson.data.tier,
        totalPoints: signupJson.data.totalPoints,
      });
      setStep('success');
      setShowCardModal(true);
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
    if (resendCooldown > 0 || !formData) return;

    setError(null);
    try {
      const response = await fetch('/api/public/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          joinCode,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Failed to resend code');
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
  // RENDER
  // ============================================

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#7F0404] py-6 px-4 text-center">
          {businessLogo ? (
            <img
              src={businessLogo}
              alt={businessName}
              className="h-12 mx-auto mb-2"
            />
          ) : (
            <h1 className="text-2xl font-bold text-white">{businessName}</h1>
          )}
          <p className="text-white/80 text-sm">Loyalty Rewards Program</p>
        </div>

        <div className="flex-1 container mx-auto px-4 py-8 max-w-md">
          {/* Benefits (only on step 1) */}
          {step === 'info' && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-900">Earn Points</p>
                <p className="text-[10px] text-gray-500">
                  {pointsPerPurchase || 1} pt per{' '}
                  {pesosPerPoint ? `P${pesosPerPoint}` : 'purchase'}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-900">Get Rewards</p>
                <p className="text-[10px] text-gray-500">
                  Redeem for exclusive perks
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: Customer Info */}
          {step === 'info' && (
            <form
              onSubmit={step1Form.handleSubmit(onStep1Submit)}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Get Your Loyalty Card
                </h2>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...step1Form.register('fullName')}
                    type="text"
                    placeholder="Juan Dela Cruz"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
                {step1Form.formState.errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">
                    {step1Form.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...step1Form.register('email')}
                    type="email"
                    placeholder="juan@email.com"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>
                {step1Form.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {step1Form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...step1Form.register('phone')}
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="09171234567"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    onKeyDown={(e) => {
                      if (
                        [
                          'Backspace',
                          'Delete',
                          'Tab',
                          'Escape',
                          'Enter',
                          'ArrowLeft',
                          'ArrowRight',
                        ].includes(e.key)
                      )
                        return;
                      if (!/^\d$/.test(e.key)) e.preventDefault();
                    }}
                  />
                </div>
                {step1Form.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-500">
                    {step1Form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Referral Code (Optional) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referral Code <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...step1Form.register('referralCode')}
                    type="text"
                    maxLength={10}
                    placeholder="e.g. 55F3EC"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors uppercase"
                  />
                </div>
                {step1Form.formState.errors.referralCode && (
                  <p className="mt-1 text-xs text-red-500">
                    {step1Form.formState.errors.referralCode.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Verify Email & Continue
                  </>
                )}
              </button>

              <p className="mt-4 text-xs text-center text-gray-500">
                We&apos;ll send a 6-digit code to verify your email address.
              </p>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 'verify' && (
            <form
              onSubmit={step2Form.handleSubmit(onStep2Submit)}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <button
                type="button"
                onClick={() => {
                  setStep('info');
                  setError(null);
                  step2Form.reset();
                }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Verify Your Email
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                We sent a 6-digit code to{' '}
                <strong className="text-gray-700">{formData?.email}</strong>
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Code Input */}
              <div className="mb-6">
                <input
                  {...step2Form.register('code')}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  disabled={isSubmitting}
                  className="w-full py-4 text-center text-3xl font-mono font-bold tracking-[0.5em] border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  onKeyDown={(e) => {
                    if (
                      [
                        'Backspace',
                        'Delete',
                        'Tab',
                        'Escape',
                        'Enter',
                        'ArrowLeft',
                        'ArrowRight',
                      ].includes(e.key)
                    )
                      return;
                    if (!/^\d$/.test(e.key)) e.preventDefault();
                  }}
                />
                {step2Form.formState.errors.code && (
                  <p className="mt-1 text-xs text-red-500 text-center">
                    {step2Form.formState.errors.code.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify & Get Card
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

          {/* STEP 3: Success */}
          {step === 'success' && cardData && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Welcome to {businessName}!
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Your loyalty card is ready. Show the QR code at checkout to earn
                points!
              </p>
              <button
                onClick={() => setShowCardModal(true)}
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                View My Card
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="py-4 text-center">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-gray-500">NoxaLoyalty</span>
          </p>
        </footer>
      </div>

      {/* Card Modal */}
      {cardData && (
        <CardModal
          isOpen={showCardModal}
          onClose={() => setShowCardModal(false)}
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
