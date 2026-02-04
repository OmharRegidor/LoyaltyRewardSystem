// apps/web/app/business/[slug]/card/lookup-form.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import { CardModal } from './card-modal';

// ============================================
// VALIDATION SCHEMA
// ============================================

const PhoneLookupSchema = z.object({
  phone: z
    .string()
    .length(11, 'Phone number must be exactly 11 digits')
    .regex(/^\d+$/, 'Phone number must contain only digits'),
});

type PhoneLookupInput = z.infer<typeof PhoneLookupSchema>;

// ============================================
// TYPES
// ============================================

interface LookupFormProps {
  businessSlug: string;
  businessName: string;
}

interface CardData {
  customerName: string;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
}

// ============================================
// COMPONENT
// ============================================

export function LookupForm({ businessSlug, businessName }: LookupFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneLookupInput>({
    resolver: zodResolver(PhoneLookupSchema),
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = async (data: PhoneLookupInput) => {
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

      // Show card modal with returned data
      setCardData({
        customerName: json.data.customerName,
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

  const handleCloseModal = () => {
    setCardData(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">
            View My Card
          </h2>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Phone */}
        <div className="mb-6">
          <label htmlFor="lookupPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            {...register('phone')}
            type="tel"
            inputMode="numeric"
            maxLength={11}
            id="lookupPhone"
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
          <p className="mt-1 text-xs text-gray-500">
            Enter the phone number you used to sign up
          </p>
        </div>

        {/* Submit Button */}
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

      {/* Card Modal */}
      {cardData && (
        <CardModal
          isOpen={true}
          onClose={handleCloseModal}
          customerName={cardData.customerName}
          businessName={businessName}
          qrCodeUrl={cardData.qrCodeUrl}
          tier={cardData.tier}
          totalPoints={cardData.totalPoints}
        />
      )}
    </>
  );
}
