"use client";

import { useState } from "react";
import { Loader2, Coins, TrendingUp, ChevronDown, Banknote } from "lucide-react";
import { motion } from "framer-motion";
import type { TierKey } from "@/types/staff-pos.types";
import { TIERS } from "@/types/staff-pos.types";
import { CashPaymentInput } from "@/components/pos/CashPaymentInput";

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
  amountTenderedCentavos: number;
  onTenderedChange: (amount: number) => void;
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
  amountTenderedCentavos,
  onTenderedChange,
  isProcessing,
  onComplete,
}: OrderSummaryProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const tierInfo = TIERS[customerTier];
  const bonusPoints = pointsToEarn - basePointsToEarn;
  const isEmpty = cartItemCount === 0;
  const changeCentavos = amountTenderedCentavos - totalDueCentavos;

  const cashSummary =
    amountTenderedCentavos > 0
      ? changeCentavos >= 0
        ? `Change ₱${(changeCentavos / 100).toFixed(2)}`
        : `Short ₱${(Math.abs(changeCentavos) / 100).toFixed(2)}`
      : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 space-y-2">
        {/* Expanded: Subtotal / Discount / Exchange breakdown */}
        {detailsOpen && (
          <>
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
          </>
        )}

        {/* TOTAL DUE — always visible, tappable toggle */}
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          className={`w-full flex items-center justify-between ${detailsOpen ? "pt-2 border-t border-gray-200" : ""}`}
        >
          <span className="text-base font-bold text-gray-900">TOTAL DUE</span>
          <span className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-gray-900">
              ₱{(totalDueCentavos / 100).toFixed(2)}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {/* Collapsed: compact info line */}
        {!detailsOpen && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-0.5 text-yellow-600 font-medium">
              <Coins className="w-3 h-3" />
              +{pointsToEarn.toLocaleString()} pts
            </span>
            {cashSummary && (
              <>
                <span className="text-gray-300">·</span>
                <span
                  className={`font-medium ${changeCentavos >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {cashSummary}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Expanded: Cash tendered + Points to earn */}
      {detailsOpen && (
        <>
          {/* Cash tendered (optional, collapsible) */}
          {totalDueCentavos > 0 && (
            <div className="px-4 pb-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCashOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Banknote className="w-4 h-4" />
                    Cash Tendered
                  </span>
                  <span className="flex items-center gap-1.5">
                    {!cashOpen && amountTenderedCentavos > 0 && (
                      <span
                        className={`text-xs font-semibold ${changeCentavos >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {cashSummary}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${cashOpen ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
                {cashOpen && (
                  <div className="px-3 pb-3">
                    <CashPaymentInput
                      totalCentavos={totalDueCentavos}
                      onTenderedChange={onTenderedChange}
                      disabled={isProcessing}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

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
        </>
      )}

      {/* Action — always visible */}
      <div className="p-4 pt-0">
        <motion.button
          onClick={onComplete}
          disabled={isEmpty || isProcessing}
          whileTap={{ scale: 0.97 }}
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
        </motion.button>
      </div>
    </div>
  );
}
