// apps/web/components/team/invite-modal.tsx

'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2, Copy, Mail, MapPin, User } from 'lucide-react';
import { sendStaffInvite } from '@/lib/staff';

interface InviteModalProps {
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteModal({ businessId, onClose, onSuccess }: InviteModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await sendStaffInvite(businessId, { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        role: 'cashier', // Always cashier - no manager role needed
        branchName: branchName.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error || 'Failed to create invite');
        setIsLoading(false);
        return;
      }

      // Check if we have the invite data
      if ('data' in result && result.data) {
        setInviteLink(`${window.location.origin}/invite/${result.data.token}`);
      } else if ('invite' in result && result.invite) {
        // Fallback for old response format
        setInviteLink(`${window.location.origin}/invite/${(result as any).invite.token}`);
      } else {
        setError('Invite created but could not generate link. Please check Team page.');
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Invite error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {inviteLink ? 'Invite Created!' : 'Invite Cashier'}
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
              
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                Invite created for
              </p>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">{name}</p>
              {branchName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Branch: {branchName}
                </p>
              )}
              
              <p className="text-sm text-gray-500 mb-4">
                Share this link with them to join your team:
              </p>

              {/* Invite Link Box */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none font-mono"
                    style={{ minWidth: 0 }}
                  />
                  <button
                    onClick={copyLink}
                    className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium shrink-0 ${
                      copied 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                        : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 hover:bg-cyan-200 dark:hover:bg-cyan-900/50'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  ⚠️ Important: Share this link manually
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  No email is sent automatically. Please send this link to <strong>{name}</strong> via SMS, Messenger, or any messaging app.
                </p>
              </div>

              {/* Steps */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  What happens next:
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>{name} opens the link you shared</li>
                  <li>They create an account or login</li>
                  <li>They're added to your team as a Cashier</li>
                  <li>They can start scanning customer QR codes</li>
                </ol>
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
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Info Banner */}
              <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                <p className="text-sm text-cyan-800 dark:text-cyan-200">
                  <strong>Cashier Role:</strong> Can only scan customer QR codes and award points. No access to dashboard, reports, or settings.
                </p>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cashier's Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Maria Santos"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This email will be used for their login account
                </p>
              </div>

              {/* Branch Name Field (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g., SM Mall Branch, Main Store"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Useful if you have multiple store locations
                </p>
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
                  disabled={isLoading || !name.trim() || !email.trim()}
                  className="flex-1 py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Invite'
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