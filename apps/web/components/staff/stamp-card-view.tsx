'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stamp, Undo2, Gift, Loader2, CheckCircle } from 'lucide-react';
import { getStampGridCols, STAMP_CARD_ASPECT } from '@/lib/stamp-grid';

interface StampCardData {
  card_id: string;
  stamps_collected: number;
  total_stamps: number;
  reward_title: string;
  is_completed: boolean;
  milestones?: Array<{ position: number; label: string }>;
  redeemed_milestones?: Array<{ position: number }>;
  paused_at_milestone?: number | null;
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
  const pausedAt = stampCard?.paused_at_milestone ?? null;
  const milestoneLabel = pausedAt
    ? stampCard?.milestones?.find(m => m.position === pausedAt)?.label ?? 'Milestone'
    : null;

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

  async function handleRedeemMilestone() {
    if (!stampCard?.card_id) return;
    setIsRedeeming(true);
    try {
      const res = await fetch('/api/staff/stamp/redeem-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stampCardId: stampCard.card_id, staffId }),
      });
      const data = await res.json();
      if (data.success) {
        onStampAdded({
          success: true,
          card_id: stampCard.card_id,
          stamps_collected: data.stamps_collected,
          total_stamps: data.total_stamps,
          is_completed: false,
          reward_title: stampCard.reward_title,
        });
      }
    } finally {
      setIsRedeeming(false);
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

  const cols = getStampGridCols(totalStamps);
  const rows = Math.ceil(totalStamps / cols);
  const gap = totalStamps > 30 ? '4px' : totalStamps > 15 ? '5px' : '6px';
  return (
    <div className="space-y-6">
      {/* Stamp Card */}
      <div className="rounded-2xl border border-amber-200/80 shadow-sm overflow-hidden" style={{ aspectRatio: `${STAMP_CARD_ASPECT}` }}>
        <div className="h-full bg-gradient-to-br from-amber-50 via-orange-50/80 to-yellow-50 p-4 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 pb-1">
            <span className="text-base font-bold text-gray-800">Stamp Card</span>
            <span className="text-sm font-bold text-primary">
              {stampsCollected}/{totalStamps}
            </span>
          </div>

          {/* Stamp grid — fills card, stamps adapt to cell size */}
          <div
            className="flex-1 grid min-h-0 place-items-center"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gap,
            }}
          >
            {Array.from({ length: totalStamps }, (_, i) => {
              const position = i + 1;
              const isFilled = i < stampsCollected;
              const isLast = i === totalStamps - 1;
              const milestone = stampCard?.milestones?.find(m => m.position === position);
              const isRedeemedMilestone = stampCard?.redeemed_milestones?.some(r => r.position === position);
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{ scale: isFilled ? 1 : 0.92 }}
                  className={`w-full h-full max-h-16 max-w-16 rounded-sm border-[1.5px] flex items-center justify-center transition-colors ${
                    milestone && isFilled && isRedeemedMilestone
                      ? 'border-green-500 bg-green-500 text-white shadow-sm'
                      : milestone && isFilled && !isRedeemedMilestone
                        ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                      : milestone && !isFilled
                        ? 'border-amber-400 bg-amber-50 text-amber-700 border-dashed'
                      : isFilled
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : isLast
                          ? 'border-orange-400 bg-orange-50 text-orange-500 border-dashed'
                          : 'border-stone-200/80 bg-white/60 text-stone-300'
                  }`}
                >
                  {milestone ? (
                    <span className="text-[7px] font-bold leading-tight text-center overflow-hidden px-0.5">
                      {milestone.label}
                    </span>
                  ) : isLast && !isFilled ? (
                    <span className="text-[9px] font-extrabold tracking-wide">FREE</span>
                  ) : (
                    <Stamp className="w-[40%] h-[40%]" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <p className="text-center text-xs font-semibold text-gray-500 shrink-0 pt-1">
            {isCompleted
              ? `🎉 Reward ready: ${rewardTitle}`
              : `${totalStamps - stampsCollected} more → ${rewardTitle}`}
          </p>
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
        ) : pausedAt ? (
          <button
            onClick={handleRedeemMilestone}
            disabled={isRedeeming}
            className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isRedeeming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Gift className="w-5 h-5" />
            )}
            Redeem: {milestoneLabel}
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
