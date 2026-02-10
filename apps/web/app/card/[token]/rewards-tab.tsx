// apps/web/app/card/[token]/rewards-tab.tsx

'use client';

import { Gift, Lock, Check } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  category: string | null;
  image_url: string | null;
  stock: number | null;
}

interface RewardsTabProps {
  rewards: Reward[];
  customerPoints: number;
  customerTier: string;
}

// ============================================
// TIER ORDER FOR COMPARISON
// ============================================

const TIER_ORDER: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
};

// ============================================
// COMPONENT
// ============================================

export function RewardsTab({
  rewards,
  customerPoints,
  customerTier,
}: RewardsTabProps) {
  if (rewards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Rewards Available
        </h3>
        <p className="text-gray-500 text-sm">
          Check back later for exciting rewards!
        </p>
      </div>
    );
  }

  const canAfford = (pointsCost: number) => customerPoints >= pointsCost;
  const pointsNeeded = (pointsCost: number) =>
    Math.max(0, pointsCost - customerPoints);

  return (
    <div className="space-y-4">
      {rewards.map((reward) => {
        const affordable = canAfford(reward.points_cost);
        const needed = pointsNeeded(reward.points_cost);

        return (
          <div
            key={reward.id}
            className={`border rounded-xl p-4 transition-all ${
              affordable
                ? 'border-green-200 bg-green-50/50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Image or Icon */}
              {reward.image_url ? (
                <img
                  src={reward.image_url}
                  alt={reward.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <Gift className="w-7 h-7 text-purple-500" />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-gray-900">{reward.title}</h4>
                  <span
                    className={`shrink-0 text-sm font-semibold px-2 py-0.5 rounded-full ${
                      affordable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {reward.points_cost.toLocaleString()} pts
                  </span>
                </div>

                {reward.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {reward.description}
                  </p>
                )}

                {/* Status */}
                <div className="mt-3">
                  {affordable ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                      <Check className="w-4 h-4" />
                      You can redeem this!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                      <Lock className="w-4 h-4" />
                      {needed.toLocaleString()} more points needed
                    </span>
                  )}
                </div>

                {/* Category & Stock */}
                <div className="flex items-center gap-3 mt-2">
                  {reward.category && (
                    <span className="text-xs text-gray-400">
                      {reward.category}
                    </span>
                  )}
                  {reward.stock !== null && reward.stock <= 5 && (
                    <span className="text-xs text-amber-600">
                      Only {reward.stock} left!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer tip */}
      <p className="text-center text-xs text-gray-500 pt-4">
        Show your QR code to the cashier to redeem rewards
      </p>
    </div>
  );
}
