"use client";

import { useState } from "react";
import { Minus, Plus, PlusCircle, Trash2, ShoppingCart } from "lucide-react";
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

  const handleAddManual = () => {
    const price = parseFloat(manualPrice);
    if (manualName.trim() && price > 0) {
      onAddManualItem(manualName, price);
      setManualName("");
      setManualPrice("");
      setShowManualInput(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Empty state */}
      {items.length === 0 && !showManualInput && (
        <div className="py-12 flex flex-col items-center justify-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
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
              className="border border-gray-100 rounded-lg p-3 bg-white"
            >
              <div className="flex items-center gap-2.5">
                {/* Colored initial */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
                  <span className={`text-sm font-bold ${color.text}`}>
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Name & price */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    <span className="line-through">₱{(item.unit_price_centavos / 100).toFixed(2)}</span>
                    <span className="ml-1">each</span>
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center border border-gray-200 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Minus className="w-3 h-3 text-gray-600" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center border border-gray-200 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3 text-gray-600" />
                  </button>
                </div>

                {/* Line total */}
                <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                  ₱{(lineTotal / 100).toFixed(2)}
                </span>

                {/* Remove */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                type="number"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-secondary focus:ring-1 focus:ring-secondary/20"
              />
            </div>
            <button
              type="submit"
              disabled={!manualName.trim() || !manualPrice || parseFloat(manualPrice) <= 0}
              className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-gray-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowManualInput(false); setManualName(""); setManualPrice(""); }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
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
