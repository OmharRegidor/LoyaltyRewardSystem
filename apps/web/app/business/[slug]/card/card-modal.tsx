// apps/web/app/business/[slug]/card/card-modal.tsx

'use client';

import { useEffect, useState } from 'react';
import { X, Star, RotateCw } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  businessName: string;
  phone?: string;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
}

// ============================================
// TIER STYLES
// ============================================

const TIER_STYLES: Record<
  string,
  {
    banner: string;
    bannerText: string;
    avatar: string;
    avatarText: string;
    label: string;
  }
> = {
  bronze: {
    banner: 'bg-amber-600',
    bannerText: 'text-amber-950',
    avatar: 'bg-amber-600',
    avatarText: 'text-white',
    label: 'Bronze',
  },
  silver: {
    banner: 'bg-gray-400',
    bannerText: 'text-gray-900',
    avatar: 'bg-gray-400',
    avatarText: 'text-white',
    label: 'Silver',
  },
  gold: {
    banner: 'bg-yellow-500',
    bannerText: 'text-yellow-950',
    avatar: 'bg-yellow-500',
    avatarText: 'text-white',
    label: 'Gold',
  },
  platinum: {
    banner: 'bg-slate-400',
    bannerText: 'text-slate-900',
    avatar: 'bg-slate-400',
    avatarText: 'text-white',
    label: 'Platinum',
  },
};

// ============================================
// HELPERS
// ============================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatPhone(raw: string): string {
  // Format 09171234567 → 0917 123 4567
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return raw;
}

// ============================================
// COMPONENT
// ============================================

export function CardModal({
  isOpen,
  onClose,
  customerName,
  businessName,
  phone,
  qrCodeUrl,
  tier,
  totalPoints,
}: CardModalProps) {
  const [isFlipped, setIsFlipped] = useState(true);
  const tierStyle = TIER_STYLES[tier] || TIER_STYLES.bronze;

  // Reset flip state when modal opens (show back face with QR first)
  useEffect(() => {
    if (isOpen) setIsFlipped(true);
  }, [isOpen]);

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

      {/* Modal container */}
      <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3D Card Container */}
        <div style={{ perspective: '1000px' }}>
          <div
            className="relative w-full transition-transform duration-600"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transitionDuration: '0.6s',
            }}
          >
            {/* ====== FRONT FACE ====== */}
            <div
              className="w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl bg-primary flex flex-col"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {/* Main content area */}
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white text-center leading-tight">
                  {businessName}
                </h2>
                <p className="text-xs xs:text-sm sm:text-base text-white/80 mt-1">
                  Loyalty Rewards
                </p>
              </div>

              {/* Tier banner */}
              <div
                className={`${tierStyle.banner} px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${tierStyle.bannerText}`} />
                  <span
                    className={`text-xs sm:text-sm font-semibold ${tierStyle.bannerText}`}
                  >
                    {tierStyle.label} Member
                  </span>
                </div>
                <button
                  onClick={() => setIsFlipped(true)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${tierStyle.bannerText} hover:bg-black/10 transition-colors`}
                  aria-label="Flip card"
                >
                  <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* ====== BACK FACE ====== */}
            <div
              className="w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl bg-white absolute top-0 left-0 flex flex-col"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Black magnetic stripe — scales with card via percentage height */}
              <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 w-full" style={{ height: '13%', marginTop: '4%' }} />

              {/* Main content — always side-by-side, scales proportionally */}
              <div className="flex-1 flex items-center gap-2 sm:gap-4" style={{ padding: '2% 4%' }}>
                {/* Left: avatar + customer info */}
                <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                  {/* Initials avatar — percentage-driven sizing */}
                  <div
                    className={`rounded-full ${tierStyle.avatar} ${tierStyle.avatarText} flex items-center justify-center font-bold shrink-0`}
                    style={{ width: '15%', maxWidth: '48px', aspectRatio: '1' , fontSize: 'clamp(10px, 2.5cqi, 16px)' }}
                  >
                    {getInitials(customerName)}
                  </div>

                  {/* Customer details — clamp-based fluid typography */}
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-bold text-gray-900 leading-tight break-words"
                      style={{ fontSize: 'clamp(11px, 3cqi, 16px)' }}
                    >
                      {customerName}
                    </h3>
                    {phone && (
                      <p className="text-gray-500 leading-tight" style={{ fontSize: 'clamp(9px, 2.2cqi, 12px)' }}>
                        {formatPhone(phone)}
                      </p>
                    )}
                    <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
                      <Star className="text-amber-500 shrink-0" style={{ width: 'clamp(10px, 2.5cqi, 14px)', height: 'clamp(10px, 2.5cqi, 14px)' }} />
                      <span className="font-semibold text-gray-700" style={{ fontSize: 'clamp(9px, 2.2cqi, 12px)' }}>
                        {totalPoints.toLocaleString()} points
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: QR Code — sized relative to card height */}
                <div className="shrink-0" style={{ width: '35%', maxWidth: '152px' }}>
                  <div className="bg-white border border-gray-200 rounded-md sm:rounded-lg shadow-sm" style={{ padding: 'clamp(2px, 1%, 6px)' }}>
                    <img
                      src={`/api/qr/${encodeURIComponent(qrCodeUrl)}`}
                      alt="Your Loyalty QR Code"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Footer — compact and proportional */}
              <div className="border-t border-gray-100 flex items-center justify-between" style={{ padding: '1.5% 4%' }}>
                <span className="text-gray-400" style={{ fontSize: 'clamp(8px, 2cqi, 12px)' }}>
                  Powered by{' '}
                  <span className="font-semibold text-gray-500">
                    NoxaLoyalty
                  </span>
                </span>
                <button
                  onClick={() => setIsFlipped(false)}
                  className="rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                  style={{ width: 'clamp(20px, 5cqi, 32px)', height: 'clamp(20px, 5cqi, 32px)' }}
                  aria-label="Flip card"
                >
                  <RotateCw style={{ width: 'clamp(10px, 2.5cqi, 16px)', height: 'clamp(10px, 2.5cqi, 16px)' }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hint text below card */}
        <p className="text-center text-xs text-white/60 mt-3">
          Tap the flip button to see {isFlipped ? 'front' : 'your details'}
        </p>
      </div>
    </div>
  );
}
