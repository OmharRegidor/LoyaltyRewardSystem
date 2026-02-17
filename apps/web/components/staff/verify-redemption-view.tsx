"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface RedemptionData {
  id: string;
  code: string;
  rewardTitle: string;
  pointsUsed: number;
  customerName: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface VerifyRedemptionResult {
  found: boolean;
  id?: string;
  redemption_code?: string;
  points_used?: number;
  status?: string;
  expires_at?: string;
  created_at?: string;
  customer_name?: string;
  customer_email?: string;
  reward_title?: string;
}

interface VerifyRedemptionViewProps {
  businessId: string;
  onCancel: () => void;
  onRedemptionCompleted: (customerName: string, pointsUsed: number) => void;
}

export function VerifyRedemptionView({
  businessId,
  onCancel,
  onRedemptionCompleted,
}: VerifyRedemptionViewProps) {
  const [redemptionCode, setRedemptionCode] = useState("");
  const [redemptionData, setRedemptionData] = useState<RedemptionData | null>(
    null,
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const verifyRedemptionCode = async () => {
    if (!redemptionCode.trim()) return;

    setIsVerifying(true);
    setError("");
    const supabase = createClient();

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "verify_redemption_code",
        {
          p_code: redemptionCode.trim(),
          p_business_id: businessId,
        },
      );

      if (rpcError) throw rpcError;

      const result = data as unknown as VerifyRedemptionResult | null;

      if (!result || !result.found) {
        setError("Redemption code not found");
        setIsVerifying(false);
        return;
      }

      if (result.status === "completed") {
        setError("This code has already been used");
        setIsVerifying(false);
        return;
      }

      if (result.expires_at && new Date(result.expires_at) < new Date()) {
        setError("This code has expired");
        setIsVerifying(false);
        return;
      }

      if (result.status === "cancelled") {
        setError("This redemption was cancelled");
        setIsVerifying(false);
        return;
      }

      setRedemptionData({
        id: result.id || "",
        code: result.redemption_code || "",
        rewardTitle: result.reward_title || "Unknown Reward",
        pointsUsed: result.points_used || 0,
        customerName: result.customer_name || "Customer",
        status: result.status || "pending",
        expiresAt: result.expires_at || "",
        createdAt: result.created_at || new Date().toISOString(),
      });
    } catch (err) {
      console.error("Verify error:", err);
      setError("Failed to verify code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const completeRedemption = async () => {
    if (!redemptionData) return;

    setIsVerifying(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: result, error: rpcError } = await supabase.rpc(
        "complete_redemption",
        {
          p_redemption_id: redemptionData.id,
          p_completed_by: user?.id || "",
        },
      );

      if (rpcError) throw rpcError;

      const completeResult = result as unknown as { success: boolean } | null;

      if (!completeResult?.success) {
        setError("Redemption could not be completed (may already be used)");
        setIsVerifying(false);
        return;
      }

      onRedemptionCompleted(
        redemptionData.customerName,
        redemptionData.pointsUsed,
      );
    } catch (err) {
      console.error("Complete redemption error:", err);
      setError("Failed to complete redemption");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-900">
        Verify Redemption
      </h2>

      {/* Code Input */}
      {!redemptionData && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 8-digit code
            </label>
            <input
              type="text"
              value={redemptionCode}
              onChange={(e) =>
                setRedemptionCode(e.target.value.toUpperCase().slice(0, 8))
              }
              placeholder="ABC123"
              className="w-full px-4 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 text-2xl font-mono text-center tracking-widest placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
              maxLength={8}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors text-gray-700 border border-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={verifyRedemptionCode}
              disabled={redemptionCode.length < 8 || isVerifying}
              className="flex-1 py-4 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-gray-900 border border-gray-900"
            >
              {isVerifying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Redemption Found */}
      {redemptionData && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-700 mb-1">
              Valid Code
            </h3>
            <p className="text-gray-500 text-sm">Ready to complete</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Code</span>
              <span className="font-mono font-bold text-yellow-600">
                {redemptionData.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reward</span>
              <span className="font-medium text-gray-900">
                {redemptionData.rewardTitle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="text-gray-900">
                {redemptionData.customerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Points Used</span>
              <span className="text-gray-900">
                {redemptionData.pointsUsed.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expires</span>
              <span className="text-gray-900">
                {new Date(redemptionData.expiresAt).toLocaleString()}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors text-gray-700 border border-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={completeRedemption}
              disabled={isVerifying}
              className="flex-1 py-4 bg-green-500 hover:bg-green-600 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-white"
            >
              {isVerifying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
