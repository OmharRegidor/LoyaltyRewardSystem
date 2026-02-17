"use client";

import { Loader2, Coins, TrendingUp } from "lucide-react";
import type { TierKey } from "@/types/staff-pos.types";
import { TIERS } from "@/types/staff-pos.types";

interface OrderSummaryProps {
  subtotalCentavos: number;
  discountCentavos: number;
  exchangeCentavos: number;
  totalDueCentavos: number;
  basePointsToEarn: number;
  pointsToEarn: number;
  tierMultiplier: number;
  customerTier: TierKey;
  pesosPerPoint: number;
  cartItemCount: number;
  isProcessing: boolean;
  onComplete: () => void;
}

export function OrderSummary({
  subtotalCentavos,
  discountCentavos,
  exchangeCentavos,
  totalDueCentavos,
  basePointsToEarn,
  pointsToEarn,
  tierMultiplier,
  customerTier,
  pesosPerPoint,
  cartItemCount,
  isProcessing,
  onComplete,
}: OrderSummaryProps) {
  const tierInfo = TIERS[customerTier];
  const bonusPoints = pointsToEarn - basePointsToEarn;
  const isEmpty = cartItemCount === 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Breakdown */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-700">
            ₱{(subtotalCentavos / 100).toFixed(2)}
          </span>
        </div>

        {discountCentavos > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Discount</span>
            <span className="text-green-600">
              -₱{(discountCentavos / 100).toFixed(2)}
            </span>
          </div>
        )}

        {exchangeCentavos > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-yellow-600">Points Payment</span>
            <span className="text-yellow-600">
              -₱{(exchangeCentavos / 100).toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-base font-bold text-gray-900">TOTAL DUE</span>
          <span className="text-xl font-bold text-gray-900">
            ₱{(totalDueCentavos / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Points to earn */}
      <div className="px-4 pb-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-700">Points to Earn</span>
            </div>
            <span className="text-lg font-bold text-yellow-600">
              +{pointsToEarn.toLocaleString()}
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">
                Base (₱{pesosPerPoint} = 1 pt)
              </span>
              <span className="text-gray-600">
                {basePointsToEarn.toLocaleString()}
              </span>
            </div>
            {bonusPoints > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-amber-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  {tierInfo.name} bonus ({tierMultiplier}x)
                </span>
                <span className="text-amber-600">
                  +{bonusPoints.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="p-4 pt-0">
        <button
          onClick={onComplete}
          disabled={isEmpty || isProcessing}
          className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold text-gray-900 border border-gray-900 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            "Complete & Award"
          )}
        </button>
      </div>
    </div>
  );
}
