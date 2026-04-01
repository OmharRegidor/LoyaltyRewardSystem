"use client";

import { CheckCircle, Printer, ShoppingCart, Stamp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { StaffSaleResult, StaffCartItem } from "@/types/staff-pos.types";
import type { PaymentMethod } from "@/types/pos.types";

interface StampReceiptInfo {
  stamps_collected: number;
  total_stamps: number;
  is_completed: boolean;
  reward_title: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSale: () => void;
  saleResult: StaffSaleResult;
  cartItems: StaffCartItem[];
  businessName: string;
  cashierName: string;
  paymentMethod: PaymentMethod;
  amountTenderedCentavos: number;
  discountReason?: string;
  loyaltyMode?: 'points' | 'stamps';
  stampResult?: StampReceiptInfo | null;
}

function formatPesos(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  gcash: "GCash",
  maya: "PayMaya",
};

export function ReceiptModal({
  isOpen,
  onNewSale,
  saleResult,
  cartItems,
  businessName,
  cashierName,
  paymentMethod,
  amountTenderedCentavos,
  discountReason,
  loyaltyMode,
  stampResult,
}: ReceiptModalProps) {
  const changeCentavos = amountTenderedCentavos - saleResult.total_centavos;
  const showChange = paymentMethod === "cash" && changeCentavos > 0;
  const now = new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl"
          >
            {/* Top — dark header */}
            <div className="bg-primary py-8 px-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <CheckCircle className="w-9 h-9 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-white">Payment Complete</h2>
              <p className="text-primary-foreground/60 text-sm mt-1">
                Order #ORD-{saleResult.sale_number}
              </p>
            </div>

            {/* Receipt body */}
            <div
              id="receipt-content"
              className="flex-1 overflow-y-auto px-8 py-6 space-y-4"
            >
              {/* Business info */}
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">{businessName}</p>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  {now.toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  {now.toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cashier: {cashierName}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-300" />

              {/* Line items */}
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">{item.name}</span>
                      <span className="text-gray-900 font-medium">
                        {formatPesos(item.unit_price_centavos * item.quantity)}
                      </span>
                    </div>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-400">
                        x{item.quantity} @ {formatPesos(item.unit_price_centavos)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-300" />

              {/* Totals */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700">
                    {formatPesos(saleResult.subtotal_centavos)}
                  </span>
                </div>
                {saleResult.discount_centavos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">
                      {discountReason || "Discount"}
                    </span>
                    <span className="text-green-600">
                      -{formatPesos(saleResult.discount_centavos)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-1">
                  <span className="text-gray-900">TOTAL</span>
                  <span className="text-gray-900">
                    {formatPesos(saleResult.total_centavos)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Payment ({METHOD_LABELS[paymentMethod]})
                  </span>
                  <span className="text-gray-700">
                    {formatPesos(amountTenderedCentavos)}
                  </span>
                </div>
                {showChange && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Change</span>
                    <span className="text-green-600 font-medium">
                      {formatPesos(changeCentavos)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stamp Card Info (stamps mode) */}
              {loyaltyMode === 'stamps' && stampResult && (
                <>
                  <div className="border-t border-dashed border-gray-300" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Stamp className="w-3 h-3" />
                      Stamp Card
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Stamp added</span>
                      <span className="text-primary font-medium">
                        {stampResult.stamps_collected}/{stampResult.total_stamps}
                      </span>
                    </div>
                    {stampResult.is_completed && (
                      <p className="text-xs text-green-600 font-medium">
                        Card complete! Reward: {stampResult.reward_title}
                      </p>
                    )}
                    {!stampResult.is_completed && (
                      <p className="text-xs text-primary/70">
                        {stampResult.total_stamps - stampResult.stamps_collected} more → {stampResult.reward_title}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Loyalty Points (points mode) */}
              {loyaltyMode !== 'stamps' && saleResult.points_earned > 0 && (
                <>
                  <div className="border-t border-dashed border-gray-300" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Loyalty Points
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Points earned</span>
                      <span className="text-amber-600 font-medium">
                        +{saleResult.points_earned} pts
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">New balance</span>
                      <span className="text-gray-700 font-medium">
                        {saleResult.new_points_balance} pts
                      </span>
                    </div>
                    {saleResult.tier_multiplier > 1 && (
                      <p className="text-xs text-amber-600">
                        {saleResult.tier_multiplier}x tier bonus applied
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="border-t border-dashed border-gray-300" />

              {/* Footer */}
              <div className="text-center pt-1">
                <p className="text-sm text-gray-500 italic">
                  Thank you for your purchase!
                </p>
                <p className="text-gray-300 mt-1 tracking-widest">
                  &#9733; &#9733; &#9733; &#9733; &#9733;
                </p>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="px-8 pb-6 pt-2 flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={onNewSale}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                New Sale
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
