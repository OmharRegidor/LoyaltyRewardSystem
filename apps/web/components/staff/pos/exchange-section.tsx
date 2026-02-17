"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Coins } from "lucide-react";

interface ExchangeSectionProps {
  customerPoints: number;
  pesosPerPoint: number;
  maxExchangePoints: number;
  currentExchangePoints: number;
  onExchangeChange: (points: number) => void;
}

export function ExchangeSection({
  customerPoints,
  pesosPerPoint,
  maxExchangePoints,
  currentExchangePoints,
  onExchangeChange,
}: ExchangeSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    currentExchangePoints > 0 ? String(currentExchangePoints) : "",
  );

  const handleApply = () => {
    const points = parseInt(inputValue) || 0;
    const capped = Math.min(Math.max(0, points), maxExchangePoints);
    onExchangeChange(capped);
  };

  const handleClear = () => {
    onExchangeChange(0);
    setInputValue("");
  };

  const handleMax = () => {
    setInputValue(String(maxExchangePoints));
    onExchangeChange(maxExchangePoints);
  };

  const exchangePesosValue = currentExchangePoints * pesosPerPoint;

  if (customerPoints <= 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-4 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Use Points as Payment
          </span>
          {currentExchangePoints > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              -{currentExchangePoints} pts (₱{exchangePesosValue.toFixed(2)})
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
          {/* Info */}
          <div className="bg-gray-50 rounded-lg p-2.5 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Available Points</span>
              <span className="text-gray-700 font-medium">
                {customerPoints.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Conversion Rate</span>
              <span className="text-gray-700 font-medium">
                1 pt = ₱{pesosPerPoint}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Max Usable</span>
              <span className="text-yellow-700 font-medium">
                {maxExchangePoints.toLocaleString()} pts (₱
                {(maxExchangePoints * pesosPerPoint).toFixed(2)})
              </span>
            </div>
          </div>

          {/* Points input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Points to use"
                min="0"
                max={maxExchangePoints}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
              />
            </div>
            <button
              onClick={handleMax}
              disabled={maxExchangePoints <= 0}
              className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              MAX
            </button>
          </div>

          {/* Peso equivalent */}
          {inputValue && parseInt(inputValue) > 0 && (
            <p className="text-xs text-gray-500 text-center">
              = ₱{((parseInt(inputValue) || 0) * pesosPerPoint).toFixed(2)} off
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              disabled={!inputValue || parseInt(inputValue) <= 0}
              className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
            {currentExchangePoints > 0 && (
              <button
                onClick={handleClear}
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
