"use client";

import { useState } from "react";
import { X, Minus, Plus, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { StaffCartItem } from "@/types/staff-pos.types";

interface CartSectionProps {
  items: StaffCartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onAddManualItem: (name: string, pricePesos: number) => void;
  subtotalCentavos: number;
}

export function CartSection({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onAddManualItem,
  subtotalCentavos,
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
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Cart</h3>
        <span className="text-xs text-gray-400">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cart Items */}
      {items.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-400">
            Add products or a custom amount
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-48 md:max-h-64 lg:max-h-80 overflow-y-auto">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 30, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: -30, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-3 flex items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₱{(item.unit_price_centavos / 100).toFixed(2)} each
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.id, item.quantity - 1)
                    }
                    className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Minus className="w-3 h-3 text-gray-600" />
                  </button>
                  <span className="w-7 text-center text-sm font-medium text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.id, item.quantity + 1)
                    }
                    className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3 text-gray-600" />
                  </button>
                </div>

                {/* Line total */}
                <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                  ₱
                  {(
                    (item.unit_price_centavos * item.quantity) /
                    100
                  ).toFixed(2)}
                </span>

                {/* Remove */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Manual Amount Input */}
      {showManualInput ? (
        <div className="p-3 border-t border-gray-100 space-y-2">
          <input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Item name"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
            autoFocus
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                ₱
              </span>
              <input
                type="number"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
              />
            </div>
            <button
              onClick={handleAddManual}
              disabled={!manualName.trim() || !manualPrice || parseFloat(manualPrice) <= 0}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowManualInput(false);
                setManualName("");
                setManualPrice("");
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => setShowManualInput(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Custom Amount
          </button>
        </div>
      )}

      {/* Subtotal */}
      {items.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Subtotal</span>
          <span className="text-base font-bold text-gray-900">
            ₱{(subtotalCentavos / 100).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
