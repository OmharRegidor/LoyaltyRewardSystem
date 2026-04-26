"use client";

import { useState } from "react";
import { Minus, Plus, PlusCircle, Trash2, ShoppingCart, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { StaffCartItem } from "@/types/staff-pos.types";

interface CartSectionProps {
  items: StaffCartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onAddManualItem: (name: string, pricePesos: number) => void;
  onClearAll: () => void;
}

const INITIAL_COLORS = [
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-sky-100", text: "text-sky-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
];

function getInitialColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

export function CartSection({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onAddManualItem,
  onClearAll,
}: CartSectionProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);

  // Hard cap per custom item. ₱1,000,000 is already absurdly high for a single
  // line item but leaves plenty of headroom for hotels or appliances.
  const MAX_PRICE_PESOS = 1_000_000;

  function validatePrice(raw: string): { ok: boolean; value: number; error: string | null } {
    if (!raw || raw.trim() === "") return { ok: false, value: 0, error: null };
    // Reject scientific notation and anything that isn't a plain decimal with up to 2 dp.
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(raw.trim())) {
      return { ok: false, value: 0, error: "Enter a valid amount (e.g. 150.00)" };
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return { ok: false, value: 0, error: "Amount must be greater than 0" };
    }
    if (parsed > MAX_PRICE_PESOS) {
      return { ok: false, value: 0, error: `Amount cannot exceed ₱${MAX_PRICE_PESOS.toLocaleString()}` };
    }
    return { ok: true, value: parsed, error: null };
  }

  function handlePriceChange(raw: string) {
    // Strip anything that isn't a digit or dot (covers e, E, +, -, spaces).
    const cleaned = raw.replace(/[^\d.]/g, "");
    // Keep at most one decimal separator.
    const firstDot = cleaned.indexOf(".");
    const normalized = firstDot === -1
      ? cleaned
      : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
    setManualPrice(normalized);
    if (!normalized) { setPriceError(null); return; }
    const { error } = validatePrice(normalized);
    setPriceError(error);
  }

  const handleAddManual = () => {
    const { ok, value, error } = validatePrice(manualPrice);
    if (!ok) {
      setPriceError(error ?? "Enter a valid amount");
      return;
    }
    if (!manualName.trim()) return;
    onAddManualItem(manualName, value);
    setManualName("");
    setManualPrice("");
    setPriceError(null);
    setShowManualInput(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Empty state */}
      {items.length === 0 && !showManualInput && (
        <div className="py-8 sm:py-12 flex flex-col items-center justify-center">
          <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Cart is empty</p>
        </div>
      )}

      {/* Cart items */}
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const color = getInitialColor(item.name);
          const lineTotal = item.unit_price_centavos * item.quantity;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 30, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: -30, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border border-gray-100 rounded-lg p-2.5 sm:p-3 bg-white space-y-2"
            >
              {/* Top row: name & remove */}
              <div className="flex items-start gap-2">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
                  <span className={`text-[10px] sm:text-xs font-bold ${color.text}`}>
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] sm:text-xs text-gray-400">
                      ₱{(item.unit_price_centavos / 100).toFixed(2)} each
                    </span>
                    {item.item_type === 'service' && item.duration_minutes && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 px-1 sm:px-1.5 py-0.5 rounded-full">
                        <Clock className="w-2.5 h-2.5" />
                        {item.duration_minutes}{item.duration_unit === 'hours' ? 'h' : item.duration_unit === 'days' ? 'd' : item.duration_unit === 'nights' ? 'n' : 'm'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom row: quantity controls & total */}
              <div className="flex items-center justify-between ml-[36px] sm:ml-[42px]">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center border border-gray-200 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Minus className="w-3 h-3 text-gray-600" />
                  </button>
                  <span className="w-6 sm:w-7 text-center text-xs sm:text-sm font-bold text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center border border-gray-200 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-900">
                  ₱{(lineTotal / 100).toFixed(2)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Manual Amount Input */}
      {showManualInput ? (
        <form onSubmit={(e) => { e.preventDefault(); handleAddManual(); }} className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Item name"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-secondary focus:ring-1 focus:ring-secondary/20"
            autoFocus
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
              <input
                type="text"
                inputMode="decimal"
                value={manualPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                onKeyDown={(e) => {
                  // Block the characters <input type="number"> would otherwise accept.
                  if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                }}
                placeholder="0.00"
                aria-invalid={priceError ? "true" : "false"}
                className={`w-full pl-7 pr-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-1 ${
                  priceError
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-200 focus:border-secondary focus:ring-secondary/20"
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={!manualName.trim() || !manualPrice || !!priceError || !validatePrice(manualPrice).ok}
              className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-gray-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowManualInput(false); setManualName(""); setManualPrice(""); setPriceError(null); }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
          {priceError && (
            <p className="text-xs text-red-600">{priceError}</p>
          )}
        </form>
      ) : (
        <button
          onClick={() => setShowManualInput(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors border border-dashed border-gray-200"
        >
          <PlusCircle className="w-4 h-4" />
          Add Custom Amount
        </button>
      )}
    </div>
  );
}
