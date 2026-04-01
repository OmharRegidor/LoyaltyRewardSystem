'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stamp, Undo2, Gift, Loader2, CheckCircle } from 'lucide-react';

interface StampCardData {
  card_id: string;
  stamps_collected: number;
  total_stamps: number;
  reward_title: string;
  is_completed: boolean;
}

interface StampCardViewProps {
  stampCard: StampCardData | null;
  customerId: string;
  businessId: string;
  staffId: string;
  onStampAdded: (result: StampResult) => void;
}

interface StampResult {
  success: boolean;
  card_id?: string;
  stamps_collected?: number;
  total_stamps?: number;
  is_completed?: boolean;
  reward_title?: string;
  error?: string;
}

export function StampCardView({
  stampCard,
  customerId,
  businessId,
  staffId,
  onStampAdded,
}: StampCardViewProps) {
  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [lastResult, setLastResult] = useState<StampResult | null>(null);

  const stampsCollected = stampCard?.stamps_collected ?? 0;
  const totalStamps = stampCard?.total_stamps ?? 10;
  const isCompleted = stampCard?.is_completed ?? false;
  const rewardTitle = stampCard?.reward_title ?? '';

  async function handleAddStamp() {
    setIsAddingStamp(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/staff/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, businessId, staffId }),
      });
      const data: StampResult = await res.json();
      setLastResult(data);
      onStampAdded(data);
    } catch {
      setLastResult({ success: false, error: 'Network error' });
    } finally {
      setIsAddingStamp(false);
    }
  }

  async function handleUndo() {
    if (!stampCard?.card_id) return;
    setIsUndoing(true);
    try {
      const res = await fetch('/api/staff/stamp/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stampCardId: stampCard.card_id, staffId }),
      });
      const data = await res.json();
      if (data.success) {
        onStampAdded({
          success: true,
          card_id: stampCard.card_id,
          stamps_collected: data.new_count,
          total_stamps: data.total_stamps,
          is_completed: false,
          reward_title: rewardTitle,
        });
      }
    } finally {
      setIsUndoing(false);
    }
  }

  async function handleRedeem() {
    if (!stampCard?.card_id) return;
    setIsRedeeming(true);
    try {
      const res = await fetch('/api/staff/stamp/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stampCardId: stampCard.card_id, staffId }),
      });
      const data = await res.json();
      if (data.success) {
        onStampAdded({
          success: true,
          card_id: data.new_card_id || '',
          stamps_collected: 0,
          total_stamps: totalStamps,
          is_completed: false,
          reward_title: data.reward_title,
        });
      }
    } finally {
      setIsRedeeming(false);
    }
  }

  // Generate stamp grid
  const stamps = Array.from({ length: totalStamps }, (_, i) => i < stampsCollected);

  return (
    <div className="space-y-6">
      {/* Stamp Grid */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Stamp Card</h3>
          <p className="text-sm text-gray-500">
            {stampsCollected} / {totalStamps} stamps
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {stamps.map((filled, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{
                scale: filled ? 1 : 0.9,
                opacity: filled ? 1 : 0.3,
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                filled
                  ? 'bg-primary border-primary text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-300'
              }`}
            >
              <Stamp className="w-5 h-5" />
            </motion.div>
          ))}
        </div>

        {/* Reward info */}
        <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center justify-center gap-2 text-amber-800">
            <Gift className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isCompleted
                ? `Reward Ready: ${rewardTitle}`
                : `${totalStamps - stampsCollected} more → ${rewardTitle}`}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {isCompleted ? (
          <button
            onClick={handleRedeem}
            disabled={isRedeeming}
            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isRedeeming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Gift className="w-5 h-5" />
            )}
            Redeem Reward
          </button>
        ) : (
          <button
            onClick={handleAddStamp}
            disabled={isAddingStamp}
            className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isAddingStamp ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Stamp className="w-5 h-5" />
            )}
            Add Stamp
          </button>
        )}

        {stampsCollected > 0 && !isCompleted && (
          <button
            onClick={handleUndo}
            disabled={isUndoing}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isUndoing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Undo2 className="w-4 h-4" />
            )}
            Undo Last Stamp
          </button>
        )}
      </div>

      {/* Success/Error feedback */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-lg text-center text-sm font-medium ${
              lastResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {lastResult.success ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {lastResult.is_completed
                  ? 'Card complete! Reward ready to redeem.'
                  : `Stamp added! (${lastResult.stamps_collected}/${lastResult.total_stamps})`}
              </div>
            ) : (
              lastResult.error
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
