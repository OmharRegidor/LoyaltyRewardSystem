"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Tag } from "lucide-react";
import type { DiscountInfo } from "@/types/staff-pos.types";

interface DiscountSectionProps {
  subtotalCentavos: number;
  discount: DiscountInfo | null;
  onDiscountChange: (discount: DiscountInfo | null) => void;
}

export function DiscountSection({
  subtotalCentavos,
  discount,
  onDiscountChange,
}: DiscountSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"percentage" | "fixed">(
    discount?.type || "percentage",
  );
  const [value, setValue] = useState(
    discount
      ? discount.type === "percentage"
        ? String(discount.value)
        : String(discount.value / 100)
      : "",
  );
  const [reason, setReason] = useState(discount?.reason || "");

  const applyDiscount = () => {
    const numValue = parseFloat(value);
    if (!numValue || numValue <= 0) {
      onDiscountChange(null);
      return;
    }

    if (type === "percentage") {
      const capped = Math.min(numValue, 100);
      onDiscountChange({ type, value: capped, reason: reason || undefined });
    } else {
      const centavos = Math.round(numValue * 100);
      const capped = Math.min(centavos, subtotalCentavos);
      onDiscountChange({ type, value: capped, reason: reason || undefined });
    }
  };

  const clearDiscount = () => {
    onDiscountChange(null);
    setValue("");
    setReason("");
  };

  // Calculate display value
  const discountCentavos = discount
    ? discount.type === "percentage"
      ? Math.round((subtotalCentavos * discount.value) / 100)
      : Math.min(discount.value, subtotalCentavos)
    : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Discount</span>
          {discount && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              -₱{(discountCentavos / 100).toFixed(2)}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setType("percentage");
                setValue("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                type === "percentage"
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              Percentage (%)
            </button>
            <button
              onClick={() => {
                setType("fixed");
                setValue("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                type === "fixed"
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              Fixed (₱)
            </button>
          </div>

          {/* Value input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              {type === "percentage" ? "%" : "₱"}
            </span>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percentage" ? "0" : "0.00"}
              min="0"
              max={type === "percentage" ? "100" : undefined}
              step={type === "percentage" ? "1" : "0.01"}
              className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
            />
          </div>

          {/* Reason */}
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={applyDiscount}
              disabled={!value || parseFloat(value) <= 0}
              className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
            {discount && (
              <button
                onClick={clearDiscount}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
