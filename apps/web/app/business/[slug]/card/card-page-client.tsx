// apps/web/app/business/[slug]/card/card-page-client.tsx

'use client';

import { useState } from 'react';
import { SignupForm } from './signup-form';
import { LookupForm } from './lookup-form';
import { CardModal } from './card-modal';
import { Gift, Star, CreditCard } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface InitialCardData {
  customerName: string;
  phone: string;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
}

interface CardPageClientProps {
  slug: string;
  businessName: string;
  business: {
    points_per_purchase: number | null;
    pesos_per_point: number | null;
  };
  initialCardData?: InitialCardData | null;
}

// ============================================
// COMPONENT
// ============================================

export function CardPageClient({
  slug,
  businessName,
  business,
  initialCardData,
}: CardPageClientProps) {
  const [showModal, setShowModal] = useState(!!initialCardData);

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-linear-to-br from-primary/10 to-secondary/10 rounded-full mb-4">
              <CreditCard className="w-6 sm:w-8 h-6 sm:h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Get Your Loyalty Card
            </h1>
            <p className="text-gray-600">
              Join {businessName}&apos;s rewards program and start earning points today!
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-linear-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-2xl p-4 text-center">
              <Star className="w-6 h-6 text-secondary mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Earn Points</p>
              <p className="text-xs text-gray-600">
                {business.points_per_purchase || 1} pt per{' '}
                {business.pesos_per_point ? `₱${business.pesos_per_point}` : 'purchase'}
              </p>
            </div>
            <div className="bg-linear-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-4 text-center">
              <Gift className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Get Rewards</p>
              <p className="text-xs text-gray-600">Redeem for exclusive perks</p>
            </div>
          </div>

          {/* Two-Panel Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            <SignupForm businessSlug={slug} businessName={businessName} />
            <LookupForm businessSlug={slug} businessName={businessName} />
          </div>

          {/* Footer Note */}
          <p className="mt-6 text-xs text-center text-gray-500">
            By signing up, you agree to receive loyalty updates from {businessName}.
          </p>
        </div>
      </div>

      {initialCardData && (
        <CardModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          customerName={initialCardData.customerName}
          businessName={businessName}
          phone={initialCardData.phone}
          qrCodeUrl={initialCardData.qrCodeUrl}
          tier={initialCardData.tier}
          totalPoints={initialCardData.totalPoints}
        />
      )}
    </>
  );
}
