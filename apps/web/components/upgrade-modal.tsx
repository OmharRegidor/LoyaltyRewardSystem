// apps/web/components/upgrade-modal.tsx

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

const FEATURES = [
  'Booking System - Online appointments & scheduling',
  'POS Integration - Seamless point of sale',
  'Unlimited customers & branches',
  'Advanced analytics & reporting',
  'API access & webhooks',
  'Priority support & dedicated account manager',
];

export function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with gradient */}
          <div className="bg-linear-to-br from-cyan-500 via-blue-600 to-blue-700 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upgrade to Enterprise</h2>
            <p className="text-blue-100 text-sm">
              {feature
                ? `"${feature}" requires the Enterprise plan`
                : 'Unlock Booking, POS, and more'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              You're currently on the{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                Free
              </span>{' '}
              plan. Upgrade to Enterprise to unlock:
            </p>

            {/* Features list */}
            <div className="space-y-3 mb-6">
              {FEATURES.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <Link
                href="/book-call"
                className="w-full py-3 px-4 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold text-center hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                Book a Call
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
