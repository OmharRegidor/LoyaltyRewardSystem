// apps/web/app/card/[token]/card-view.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download, CreditCard, Star, MapPin, Phone, Mail } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface CustomerData {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  qrCodeUrl: string;
  tier: string;
  totalPoints: number;
  business: {
    id: string;
    name: string;
    logoUrl: string | null;
    address: string | null;
    city: string | null;
  } | null;
}

interface CardViewProps {
  customer: CustomerData;
  token: string;
}

// ============================================
// TIER STYLES
// ============================================

const TIER_STYLES: Record<string, { bg: string; text: string; badge: string }> =
  {
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

export function CardView({ customer, token }: CardViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const tierStyle = TIER_STYLES[customer.tier] || TIER_STYLES.bronze;

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/card/${token}/pdf`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LoyaltyHub-Card-${customer.fullName.replace(
        /\s+/g,
        '-'
      )}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-gray-200 py-8 px-4">
      {/* Download Button - Top Right */}
      <div className="max-w-lg mx-auto mb-4 flex justify-end">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Downloading...' : 'Download Card (PDF)'}
        </button>
      </div>

      {/* Loyalty Card */}
      <div className="max-w-3xl mx-auto">
        <div
          className={`bg-linear-to-br ${tierStyle.bg} rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* Card Header */}
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${tierStyle.text}`}>
                  {customer.business?.name || 'LoyaltyHub'}
                </h1>
                <p className={`text-sm ${tierStyle.text} opacity-80 mt-1`}>
                  Loyalty Rewards Program
                </p>
              </div>

              {/* QR Code - Top Right */}
              <div className="bg-white p-2 rounded-lg shadow-lg">
                <img
                  src={`/api/qr/${encodeURIComponent(customer.qrCodeUrl)}`}
                  alt="QR Code"
                  className="w-24 h-24"
                />
              </div>
            </div>
          </div>

          {/* Member Info */}
          <div className="px-6 pb-6">
            <div
              className={`${tierStyle.badge} inline-block px-3 py-1 rounded-full text-xs font-semibold text-white uppercase tracking-wider mb-3`}
            >
              {customer.tier} Member
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              {customer.fullName}
            </h2>

            {/* Tags/Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white">
                <Star className="w-3 h-3 inline mr-1" />
                {customer.totalPoints.toLocaleString()} pts
              </span>
            </div>
          </div>

          {/* Card Details Section */}
          <div className="bg-white/10 backdrop-blur-sm px-6 py-4">
            <div className="grid grid-cols-1 gap-3">
              {customer.business?.address && (
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="text-sm">
                    {customer.business.address}
                    {customer.business.city && `, ${customer.business.city}`}
                  </span>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-center gap-2 text-white/90">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
              )}

              {customer.email && (
                <div className="flex items-center gap-2 text-white/90">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{customer.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-black/20 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-white/70" />
              <span className="text-xs text-white/70">
                Digital Loyalty Card
              </span>
            </div>
            <div className="text-xs text-white/70">
              Powered by{' '}
              <span className="font-semibold text-white">LoyaltyHub</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-3">
            How to use your card
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold">1.</span>
              Show the QR code to the cashier at checkout
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold">2.</span>
              Earn points on every purchase
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold">3.</span>
              Redeem points for exclusive rewards
            </li>
          </ul>

          <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-700">
              <strong>Tip:</strong> Download the LoyaltyHub app for real-time
              point tracking and exclusive mobile-only rewards!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
