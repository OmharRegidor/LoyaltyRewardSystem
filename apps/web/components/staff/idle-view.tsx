"use client";

import { QrCode, UserPlus, CheckCircle } from "lucide-react";

interface IdleViewProps {
  onStartScanner: () => void;
  onAddCustomer: () => void;
  onVerifyCode: () => void;
}

export function IdleView({
  onStartScanner,
  onAddCustomer,
  onVerifyCode,
}: IdleViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <button
        onClick={onStartScanner}
        className="w-40 h-40 bg-yellow-400 hover:bg-yellow-500 rounded-full flex flex-col items-center justify-center mb-6 hover:shadow-2xl hover:shadow-yellow-400/30 hover:scale-105 transition-all active:scale-95 border border-gray-900 text-gray-900"
      >
        <QrCode className="w-14 h-14 mb-2" />
        <span className="font-semibold text-sm">Scan Customer</span>
      </button>
      <p className="text-gray-500 text-sm mb-8">
        Tap to scan customer QR code
      </p>

      <div className="flex gap-3 mb-4">
        <button
          onClick={onAddCustomer}
          className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors"
        >
          <UserPlus className="w-5 h-5 text-yellow-600" />
          <span className="text-gray-700 text-sm">Add Customer</span>
        </button>
        <button
          onClick={onVerifyCode}
          className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-gray-700 text-sm">Verify Code</span>
        </button>
      </div>
      <p className="text-gray-500 text-xs">
        Add customers or verify redemption codes
      </p>
    </div>
  );
}
