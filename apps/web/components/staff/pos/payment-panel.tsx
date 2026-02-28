"use client";

import { useState } from "react";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Receipt,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import type { PaymentMethod } from "@/types/pos.types";

interface PaymentPanelProps {
  subtotalCentavos: number;
  discountCentavos: number;
  discountReason?: string;
  totalDueCentavos: number;
  amountTenderedCentavos: number;
  onTenderedChange: (centavos: number) => void;
  onComplete: (method: PaymentMethod) => void;
  onBack: () => void;
  isProcessing: boolean;
  pointsToEarn?: number;
  customerTier?: string;
}

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "gcash", label: "GCash", icon: Smartphone },
  { key: "maya", label: "PayMaya", icon: Smartphone },
];

function getQuickAmounts(totalCentavos: number): number[] {
  const amounts = [totalCentavos];
  const pesos = totalCentavos / 100;

  if (pesos <= 100) {
    const rounded = Math.ceil(pesos / 100) * 100 * 100;
    if (rounded > totalCentavos) amounts.push(rounded);
  } else if (pesos <= 500) {
    const r500 = Math.ceil(pesos / 500) * 500 * 100;
    if (r500 > totalCentavos) amounts.push(r500);
  } else {
    const r1000 = Math.ceil(pesos / 1000) * 1000 * 100;
    if (r1000 > totalCentavos) amounts.push(r1000);
  }

  return amounts;
}

function formatPesos(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentPanel({
  subtotalCentavos,
  discountCentavos,
  discountReason,
  totalDueCentavos,
  amountTenderedCentavos,
  onTenderedChange,
  onComplete,
  onBack,
  isProcessing,
  pointsToEarn,
  customerTier,
}: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const isCash = method === "cash";
  const canComplete = !isCash || amountTenderedCentavos >= totalDueCentavos;
  const quickAmounts = getQuickAmounts(totalDueCentavos);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Payment Method */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Payment Method
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon;
              const active = method === pm.key;
              return (
                <button
                  key={pm.key}
                  onClick={() => {
                    setMethod(pm.key);
                    if (pm.key !== "cash") onTenderedChange(totalDueCentavos);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {pm.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border border-gray-200 rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-700">{formatPesos(subtotalCentavos)}</span>
          </div>
          {discountCentavos > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">{discountReason || "Discount"}</span>
              <span className="text-green-600">-{formatPesos(discountCentavos)}</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-1.5 flex justify-between font-bold text-base">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{formatPesos(totalDueCentavos)}</span>
          </div>
          {pointsToEarn && pointsToEarn > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 pt-1">
              <span className="capitalize">{customerTier}</span>
              <span>•</span>
              <span>Earn {pointsToEarn} pts</span>
            </div>
          )}
        </div>

        {/* Amount Tendered — Cash only */}
        {isCash && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Amount Tendered
            </p>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₱</span>
              <input
                type="number"
                value={amountTenderedCentavos > 0 ? (amountTenderedCentavos / 100).toString() : ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onTenderedChange(isNaN(val) ? 0 : Math.round(val * 100));
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-3 py-3 text-2xl font-bold text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-300 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => onTenderedChange(amt)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    amountTenderedCentavos === amt
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {formatPesos(amt)}
                </button>
              ))}
            </div>
            {amountTenderedCentavos >= totalDueCentavos && amountTenderedCentavos > 0 && (
              <div className="mt-3 text-center">
                <span className="text-sm text-gray-500">Change: </span>
                <span className="text-lg font-bold text-green-600">
                  {formatPesos(amountTenderedCentavos - totalDueCentavos)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div className="border-t border-gray-200 bg-white p-4 space-y-2">
        <button
          onClick={() => onComplete(method)}
          disabled={!canComplete || isProcessing}
          className="w-full py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground border border-secondary-foreground rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Receipt className="w-5 h-5" />
              Complete Payment
            </>
          )}
        </button>
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
      </div>
    </div>
  );
}
