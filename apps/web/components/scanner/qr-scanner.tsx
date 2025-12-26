'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QRScannerProps {
  onScan: (result: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Request camera permission
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  const handleSimulatedScan = () => {
    onScan('CUST_' + Math.random().toString(36).substr(2, 9));
  };

  return (
    <div className="h-full bg-black relative overflow-hidden flex flex-col">
      {/* Top Bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-20 bg-black/40 backdrop-blur-sm px-6 py-4 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button className="p-2 hover:bg-white/10 rounded-lg transition">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white font-semibold">Scan Customer QR</h1>
        <button className="p-2 hover:bg-white/10 rounded-lg transition">
          <HelpCircle className="w-6 h-6 text-white" />
        </button>
      </motion.div>

      {/* Camera View */}
      <motion.div
        className="flex-1 relative flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Simulated camera feed with gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/50 to-transparent" />

        {/* QR Viewfinder Frame */}
        <motion.div
          className="absolute w-64 h-64 border-4 border-cyan-400 rounded-2xl"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(6, 182, 212, 0.4)',
              '0 0 0 30px rgba(6, 182, 212, 0)',
            ],
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          {/* Corner Brackets */}
          <div className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-cyan-400" />
          <div className="absolute -top-4 -right-4 w-8 h-8 border-t-4 border-r-4 border-cyan-400" />
          <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-4 border-l-4 border-cyan-400" />
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-cyan-400" />

          {/* Center Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-1 h-12 bg-cyan-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="w-12 h-1 bg-cyan-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Instruction */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 bg-black/40 backdrop-blur-sm px-6 py-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="text-white text-lg font-medium">
          Point QR code at camera
        </p>
        <p className="text-gray-300 text-sm mt-2">
          Scanning will start automatically
        </p>

        {/* Test Scan Button */}
        <motion.button
          onClick={handleSimulatedScan}
          className="mt-6 px-6 py-2 bg-cyan-400 text-black font-semibold rounded-lg hover:bg-cyan-300 transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Simulate Scan (Test)
        </motion.button>
      </motion.div>

      {/* Permission Error */}
      <AnimatePresence>
        {hasPermission === false && (
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center text-white space-y-4 px-6">
              <h2 className="text-2xl font-bold">Camera Permission Denied</h2>
              <p className="text-gray-300">
                Please enable camera access to use the QR scanner
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
