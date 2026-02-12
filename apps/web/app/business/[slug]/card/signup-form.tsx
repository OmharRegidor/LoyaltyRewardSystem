// apps/web/app/business/[slug]/card/signup-form.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { CardModal } from './card-modal';

// ============================================
// VALIDATION SCHEMA
// ============================================

const SelfSignupSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
});

type SelfSignupInput = z.infer<typeof SelfSignupSchema>;

// ============================================
// TYPES
// ============================================

interface SignupFormProps {
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

// ============================================
// COMPONENT
// ============================================

export function SignupForm({ businessSlug, businessName }: SignupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SelfSignupInput>({
    resolver: zodResolver(SelfSignupSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
    },
  });

  const onSubmit = async (data: SelfSignupInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/business/${businessSlug}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || 'Something went wrong. Please try again.');
        return;
      }

      // Show card modal with returned data
      setCardData({
        customerName: json.data.customerName,
        phone: data.phone,
        qrCodeUrl: json.data.qrCodeUrl,
        tier: json.data.tier,
        totalPoints: json.data.totalPoints,
      });
      reset();
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setCardData(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-t-primary border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">
            New Customer
          </h2>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Full Name */}
        <div className="mb-4">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('fullName')}
            type="text"
            id="fullName"
            placeholder="Juan Dela Cruz"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            disabled={isSubmitting}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('phone')}
            type="tel"
            inputMode="numeric"
            maxLength={11}
            id="phone"
            placeholder="09171234567"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            disabled={isSubmitting}
            onKeyDown={(e) => {
              // Allow: backspace, delete, tab, escape, enter, arrows
              if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
              // Block non-digits
              if (!/^\d$/.test(e.key)) e.preventDefault();
            }}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Email (Optional) */}
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            placeholder="juan@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-linear-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing up...
            </>
          ) : (
            'Get My Card'
          )}
        </button>
      </form>

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
