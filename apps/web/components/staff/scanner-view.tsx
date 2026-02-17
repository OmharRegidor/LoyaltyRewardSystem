"use client";

import { SwitchCamera } from "lucide-react";

interface ScannerViewProps {
  scannerContainerId: string;
  onSwitchCamera: () => void;
  onCancel: () => void;
}

export function ScannerView({
  scannerContainerId,
  onSwitchCamera,
  onCancel,
}: ScannerViewProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm aspect-square bg-gray-900 rounded-2xl overflow-hidden mb-4 border border-gray-200">
        <div id={scannerContainerId} className="w-full h-full" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-yellow-400 rounded-xl relative">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-yellow-400 rounded-br-lg" />
            </div>
          </div>
        </div>
        <button
          onClick={onSwitchCamera}
          className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
        >
          <SwitchCamera className="w-5 h-5 text-white" />
        </button>
      </div>
      <p className="text-gray-500 mb-4">Point camera at customer's QR code</p>
      <button
        onClick={onCancel}
        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-700 border border-gray-300"
      >
        Cancel
      </button>
    </div>
  );
}
