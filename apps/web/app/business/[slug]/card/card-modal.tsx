// apps/web/app/business/[slug]/card/card-modal.tsx

'use client';

import { useEffect } from 'react';
import { X, Star, CreditCard } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  businessName: string;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
}

// ============================================
// TIER STYLES
// ============================================

const TIER_STYLES: Record<string, { bg: string; text: string; badge: string }> = {
  bronze: {
    bg: 'from-amber-700 to-amber-900',
    text: 'text-amber-100',
    badge: 'bg-amber-600',
  },
  silver: {
    bg: 'from-gray-400 to-gray-600',
    text: 'text-gray-100',
    badge: 'bg-gray-500',
  },
  gold: {
    bg: 'from-yellow-500 to-yellow-700',
    text: 'text-yellow-100',
    badge: 'bg-yellow-600',
  },
  platinum: {
    bg: 'from-slate-600 to-slate-800',
    text: 'text-slate-100',
    badge: 'bg-slate-500',
  },
};

// ============================================
// COMPONENT
// ============================================

export function CardModal({
  isOpen,
  onClose,
  customerName,
  businessName,
  qrCodeUrl,
  tier,
  totalPoints,
}: CardModalProps) {
  const tierStyle = TIER_STYLES[tier] || TIER_STYLES.bronze;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Header */}
        <div className={`bg-gradient-to-br ${tierStyle.bg} p-6 text-center`}>
          <h2 className={`text-xl font-bold ${tierStyle.text}`}>
            {businessName}
          </h2>
          <p className={`text-sm ${tierStyle.text} opacity-80 mt-1`}>
            Loyalty Rewards
          </p>
        </div>

        {/* Card Content */}
        <div className="p-6 text-center">
          {/* Tier Badge */}
          <div className="mb-4">
            <span
              className={`${tierStyle.badge} inline-block px-3 py-1 rounded-full text-xs font-semibold text-white uppercase tracking-wider`}
            >
              {tier} Member
            </span>
          </div>

          {/* Customer Name */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {customerName}
          </h3>

          {/* QR Code */}
          <div className="bg-white border-2 border-gray-100 rounded-xl p-4 inline-block mb-4 shadow-lg">
            <img
              src={`/api/qr/${encodeURIComponent(qrCodeUrl)}`}
              alt="Your Loyalty QR Code"
              className="w-48 h-48"
            />
          </div>

          {/* Points Display */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-semibold text-gray-900">
              {totalPoints.toLocaleString()} points
            </span>
          </div>

          {/* Instructions */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
            <p className="text-sm text-primary font-medium">
              Show this QR code to the cashier to earn points!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">
            Powered by <span className="font-semibold text-gray-700">NoxaLoyalty</span>
          </span>
        </div>
      </div>
    </div>
  );
}
