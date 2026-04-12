'use client';

import { useState } from 'react';
import { Stamp } from 'lucide-react';
import { getStampGridCols, STAMP_CARD_ASPECT } from '@/lib/stamp-grid';

interface Milestone {
  position: number;
  label: string;
}

interface PublicStampCardProps {
  totalStamps: number;
  rewardTitle: string;
  rewardImageUrl?: string | null;
  milestones?: Milestone[];
  stampsCollected?: number;
  redeemedMilestones?: Array<{ position: number }>;
  businessName?: string;
  businessLogoUrl?: string | null;
  /** 'stacked' shows both sides vertically, 'flippable' shows one side with click-to-flip, 'stamp-only' shows just the stamp side */
  mode?: 'stacked' | 'flippable' | 'stamp-only';
}

function StampSide({
  totalStamps,
  rewardTitle,
  rewardImageUrl,
  milestones,
  stampsCollected,
  redeemedMilestones,
}: {
  totalStamps: number;
  rewardTitle: string;
  rewardImageUrl?: string | null;
  milestones: Milestone[];
  stampsCollected: number;
  redeemedMilestones: Array<{ position: number }>;
}) {
  const cols = getStampGridCols(totalStamps);
  const rows = Math.ceil(totalStamps / cols);
  const gap = totalStamps > 30 ? '4px' : totalStamps > 15 ? '5px' : '6px';

  return (
    <div
      className="w-full rounded-2xl border border-amber-200/80 shadow-lg overflow-hidden"
      style={{ aspectRatio: `${STAMP_CARD_ASPECT}` }}
    >
      <div className="h-full bg-gradient-to-br from-amber-50 via-orange-50/80 to-yellow-50 p-4 flex flex-col">
        <div className="flex items-center justify-between shrink-0 pb-1">
          <span className="text-sm font-bold text-gray-800">
            {stampsCollected}/{totalStamps} stamps
          </span>
          {rewardTitle && (
            <span className="text-[10px] font-semibold text-amber-600/60 truncate ml-2">
              {rewardTitle}
            </span>
          )}
        </div>

        <div
          className="flex-1 grid min-h-0 place-items-center"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap,
          }}
        >
          {Array.from({ length: totalStamps }).map((_, i) => {
            const position = i + 1;
            const isFilled = i < stampsCollected;
            const isLast = i === totalStamps - 1;
            const milestone = milestones.find(m => m.position === position);
            const isRedeemedMilestone = redeemedMilestones.some(r => r.position === position);

            return (
              <div
                key={i}
                className={`w-full h-full max-h-16 max-w-16 rounded-sm border-[1.5px] flex items-center justify-center font-bold transition-colors ${
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
                  <span className="text-[7px] leading-tight text-center overflow-hidden px-0.5">
                    {milestone.label}
                  </span>
                ) : isLast && !isFilled ? (
                  <span className="text-[9px]">FREE</span>
                ) : (
                  <Stamp className="w-[40%] h-[40%]" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1">
          {rewardImageUrl && (
            <img
              src={rewardImageUrl}
              alt=""
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
          )}
          <p className="text-[11px] font-semibold text-gray-500 truncate">
            {stampsCollected >= totalStamps
              ? `🎉 Reward ready: ${rewardTitle}`
              : `${totalStamps - stampsCollected} more → ${rewardTitle}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function FrontSide({
  rewardTitle,
  rewardImageUrl,
  businessName,
  businessLogoUrl,
}: {
  rewardTitle: string;
  rewardImageUrl?: string | null;
  businessName: string;
  businessLogoUrl?: string | null;
}) {
  return (
    <div
      className="w-full rounded-2xl shadow-lg relative overflow-hidden"
      style={{
        aspectRatio: `${STAMP_CARD_ASPECT}`,
        ...(rewardImageUrl
          ? {
              backgroundImage: `url(${rewardImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { backgroundColor: 'var(--color-primary, #7F0404)' }),
      }}
    >
      {rewardImageUrl && <div className="absolute inset-0 bg-black/50" />}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-1.5 p-5">
        {businessLogoUrl ? (
          <img
            src={businessLogoUrl}
            alt=""
            className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-md"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {businessName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-[9px] font-semibold text-white/60 tracking-[3px] uppercase">
          Loyalty Card
        </span>
        <span className="text-base font-extrabold text-white text-center leading-tight drop-shadow-md">
          {businessName}
        </span>
        {rewardTitle && (
          <span className="text-xs font-medium text-white/80 drop-shadow-sm">
            {rewardTitle}
          </span>
        )}
      </div>
    </div>
  );
}

export function PublicStampCard({
  totalStamps,
  rewardTitle,
  rewardImageUrl,
  milestones = [],
  stampsCollected = 0,
  redeemedMilestones = [],
  businessName,
  businessLogoUrl,
  mode = 'stamp-only',
}: PublicStampCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (mode === 'stamp-only') {
    return (
      <StampSide
        totalStamps={totalStamps}
        rewardTitle={rewardTitle}
        rewardImageUrl={rewardImageUrl}
        milestones={milestones}
        stampsCollected={stampsCollected}
        redeemedMilestones={redeemedMilestones}
      />
    );
  }

  if (mode === 'flippable' && businessName) {
    return (
      <div className="space-y-2">
        <div
          className="cursor-pointer relative"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Stamp side */}
          <div className={`transition-opacity duration-300 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <StampSide
              totalStamps={totalStamps}
              rewardTitle={rewardTitle}
              rewardImageUrl={rewardImageUrl}
              milestones={milestones}
              stampsCollected={stampsCollected}
              redeemedMilestones={redeemedMilestones}
            />
          </div>

          {/* Front/branding side */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <FrontSide
              rewardTitle={rewardTitle}
              rewardImageUrl={rewardImageUrl}
              businessName={businessName}
              businessLogoUrl={businessLogoUrl}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">
          {isFlipped ? 'Click to view stamps' : 'Click to flip card'}
        </p>
      </div>
    );
  }

  // Stacked mode
  return (
    <div className="space-y-4">
      <StampSide
        totalStamps={totalStamps}
        rewardTitle={rewardTitle}
        rewardImageUrl={rewardImageUrl}
        milestones={milestones}
        stampsCollected={stampsCollected}
        redeemedMilestones={redeemedMilestones}
      />
      {businessName && (
        <FrontSide
          rewardTitle={rewardTitle}
          rewardImageUrl={rewardImageUrl}
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
        />
      )}
    </div>
  );
}
