"use client";

import { User, Sparkles } from "lucide-react";
import type { TierKey } from "@/types/staff-pos.types";
import { TIERS } from "@/types/staff-pos.types";

interface CustomerInfoBarProps {
  name: string;
  currentPoints: number;
  tier: TierKey;
  isFirstVisit: boolean;
}

export function CustomerInfoBar({
  name,
  currentPoints,
  tier,
  isFirstVisit,
}: CustomerInfoBarProps) {
  const tierInfo = TIERS[tier];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 truncate">
            {name}
          </h2>
          <p className="text-gray-500 text-sm">
            {currentPoints.toLocaleString()} points
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0"
          style={{ backgroundColor: tierInfo.color + "20" }}
        >
          <span className="text-sm">{tierInfo.emoji}</span>
          <span
            className="text-xs font-semibold"
            style={{ color: tierInfo.color }}
          >
            {tierInfo.name}
          </span>
        </div>
      </div>

      {isFirstVisit && (
        <div className="flex items-center gap-2 mt-3 p-2.5 bg-green-50 rounded-xl border border-green-200">
          <Sparkles className="w-4 h-4 text-green-600" />
          <span className="text-green-700 text-sm font-medium">
            First visit!
          </span>
        </div>
      )}

      {tierInfo.multiplier > 1 && (
        <div className="flex items-center gap-2 mt-3 p-2.5 bg-yellow-50 rounded-xl border border-yellow-200">
          <Sparkles className="w-4 h-4 text-yellow-600" />
          <span className="text-yellow-700 text-sm font-medium">
            {tierInfo.multiplier}x Points Bonus Active!
          </span>
        </div>
      )}
    </div>
  );
}
