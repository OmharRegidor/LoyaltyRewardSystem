// apps/web/components/team/invite-modal.tsx

'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2, Copy, Mail } from 'lucide-react';
import { sendStaffInvite } from '@/lib/staff';

interface InviteModalProps {
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteModal({
  businessId,
  onClose,
  onSuccess,
}: InviteModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'cashier' | 'manager'>('cashier');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await sendStaffInvite(businessId, { name, email, role });

    if (!result.success) {
      setError(result.error || 'Failed to send invite');
      setIsLoading(false);
      return;
    }

    // Fixed: Access data property from successful result
    setInviteLink(`${window.location.origin}/invite/${result.data.token}`);
    setIsLoading(false);

  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (inviteLink) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {inviteLink ? 'Invite Sent!' : 'Invite Team Member'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {inviteLink ? (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Invite sent to{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {name}
                </span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Share this link with them to join your team:
              </p>

              {/* Invite Link Box */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none truncate"
                  />
                  <button
                    onClick={copyLink}
                    className={`p-2 rounded-lg transition-all ${
                      copied
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500'
                    }`}
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What happens next:</strong>
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                  <li>• {name} clicks the link</li>
                  <li>• They create an account (or login)</li>
                  <li>• They're automatically added to your team</li>
                </ul>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maria Santos"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria@example.com"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Role Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('cashier')}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      role === 'cashier'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        role === 'cashier'
                          ? 'text-cyan-700 dark:text-cyan-300'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      Cashier
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Can only scan QR codes
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      role === 'manager'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        role === 'manager'
                          ? 'text-cyan-700 dark:text-cyan-300'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      Manager
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Can view reports & scan
                    </p>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !name || !email}
                  className="flex-1 py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Invite'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
