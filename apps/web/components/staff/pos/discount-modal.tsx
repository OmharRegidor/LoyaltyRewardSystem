"use client";

import { useState } from "react";
import { X, Tag, Percent, DollarSign } from "lucide-react";
import type { DiscountInfo } from "@/types/staff-pos.types";

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotalCentavos: number;
  discount: DiscountInfo | null;
  onDiscountChange: (discount: DiscountInfo | null) => void;
}

const QUICK_DISCOUNTS: {
  label: string;
  description: string;
  discount: DiscountInfo;
  icon: "percent" | "fixed";
  color: string;
}[] = [
  {
    label: "Senior/PWD",
    description: "20% off",
    discount: { type: "percentage", value: 20, reason: "Senior/PWD Discount" },
    icon: "percent",
    color: "bg-blue-100 text-blue-600",
  },
  {
    label: "Loyalty 10%",
    description: "10% off",
    discount: { type: "percentage", value: 10, reason: "Loyalty Discount" },
    icon: "percent",
    color: "bg-blue-100 text-blue-600",
  },
  {
    label: "Bulk Deal ₱100",
    description: "₱100 off",
    discount: { type: "fixed", value: 10000, reason: "Bulk Deal Discount" },
    icon: "fixed",
    color: "bg-green-100 text-green-600",
  },
];

export function DiscountModal({
  isOpen,
  onClose,
  subtotalCentavos,
  discount,
  onDiscountChange,
}: DiscountModalProps) {
  const [customType, setCustomType] = useState<"percentage" | "fixed">("percentage");
  const [customValue, setCustomValue] = useState("");

  if (!isOpen) return null;

  const handleQuickDiscount = (d: DiscountInfo) => {
    onDiscountChange(d);
    onClose();
  };

  const handleCustomApply = () => {
    const num = parseFloat(customValue);
    if (!num || num <= 0) return;

    const info: DiscountInfo = {
      type: customType,
      value: customType === "fixed" ? Math.round(num * 100) : num,
      reason: customType === "percentage" ? `Custom ${num}% Discount` : `Custom ₱${num} Discount`,
    };
    onDiscountChange(info);
    setCustomValue("");
    onClose();
  };

  const handleClear = () => {
    onDiscountChange(null);
    setCustomValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md sm:mx-4 shadow-xl relative">
        {/* Bottom sheet handle — mobile only */}
        <div className="sm:hidden flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-4 sm:right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Tag className="w-4.5 h-4.5 text-yellow-700" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Apply Discount</h2>
        </div>

        {/* Quick Discounts */}
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Quick Discounts
        </p>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {QUICK_DISCOUNTS.map((preset) => {
            const savingsCentavos =
              preset.discount.type === "percentage"
                ? Math.round((subtotalCentavos * preset.discount.value) / 100)
                : Math.min(preset.discount.value, subtotalCentavos);

            return (
              <button
                key={preset.label}
                onClick={() => handleQuickDiscount(preset.discount)}
                className="border border-gray-200 rounded-lg p-3 text-left hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${preset.color}`}>
                    {preset.icon === "percent" ? (
                      <Percent className="w-3.5 h-3.5" />
                    ) : (
                      <DollarSign className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{preset.label}</span>
                </div>
                <p className="text-xs text-gray-500">{preset.description}</p>
                {subtotalCentavos > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    -₱{(savingsCentavos / 100).toFixed(2)}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Discount */}
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Custom Discount
        </p>
        <div className="flex items-center gap-2 mb-3">
          {/* Type toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setCustomType("percentage")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                customType === "percentage" ? "bg-gray-900 text-white" : "text-gray-500"
              }`}
            >
              %
            </button>
            <button
              onClick={() => setCustomType("fixed")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                customType === "fixed" ? "bg-gray-900 text-white" : "text-gray-500"
              }`}
            >
              ₱
            </button>
          </div>
          <input
            type="number"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder={customType === "percentage" ? "e.g. 15" : "e.g. 50.00"}
            min="0"
            step={customType === "percentage" ? "1" : "0.01"}
            className="min-w-0 flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
          />
          <button
            onClick={handleCustomApply}
            disabled={!customValue || parseFloat(customValue) <= 0}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Apply
          </button>
        </div>

        {/* Clear discount */}
        {discount && (
          <button
            onClick={handleClear}
            className="w-full mt-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Clear discount
          </button>
        )}

        {/* Bottom safe area for mobile */}
        <div className="sm:hidden h-2" />
      </div>
    </div>
  );
}
