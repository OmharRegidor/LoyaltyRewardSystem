// apps/web/components/team/invite-modal.tsx

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
  X,
  UserPlus,
  Mail,
  User,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Copy,
  AlertCircle,
} from 'lucide-react';

interface InviteModalProps {
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalState = 'form' | 'submitting' | 'success' | 'error';

interface CreateAccountResponse {
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
  code?: string;
}

export function InviteModal({
  businessId,
  onClose,
  onSuccess,
}: InviteModalProps) {
  const [state, setState] = useState<ModalState>('form');
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [branchName, setBranchName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setState('submitting');
    setError('');

    const supabase = createClient();

    try {
      // Get current user (owner)
      const {
        data: { user: owner },
      } = await supabase.auth.getUser();
      if (!owner) {
        setError('You must be logged in');
        setState('form');
        return;
      }

      // Step 1: Create staff account via API route (auto-confirmed email)
      const response = await fetch('/staff/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
          fullName: name.trim(),
        }),
      });

      const result: CreateAccountResponse = await response.json();

      if (!result.success) {
        // If user already exists, we can still create the invite
        if (result.code === 'USER_EXISTS') {
          setError(
            'This email is already registered. The cashier can use their existing password to login.',
          );
          setState('form');
          return;
        }
        setError(result.error || 'Failed to create account');
        setState('form');
        return;
      }

      // Step 2: Create the invite record
      const { data: invite, error: inviteError } = await supabase
        .from('staff_invites')
        .insert({
          business_id: businessId,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          role: 'cashier',
          branch_name: branchName.trim() || null,
          invited_by: owner.id,
          status: 'pending',
        })
        .select('token')
        .single();

      if (inviteError) {
        setError(inviteError.message);
        setState('form');
        return;
      }

      // Step 3: Generate invite link
      const link = `${window.location.origin}/invite/${invite.token}`;
      setInviteLink(link);
      setState('success');
    } catch (err) {
      console.error('Invite creation error:', err);
      setError('Failed to create invite. Please try again.');
      setState('form');
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-[#7F0404] rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-white" />
            {state === 'success' ? 'Invite Created!' : 'Invite Staff/Cashier'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {state === 'success' ? (
            // Success State
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-gray-500">
                  Invite created for{' '}
                  <span className="text-gray-900 font-medium">{name}</span>
                </p>
                {branchName && (
                  <p className="text-gray-500 text-sm">Branch: {branchName}</p>
                )}
              </div>

              {/* Invite Link */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">Share this link:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-gray-800 text-sm truncate">
                    {inviteLink}
                  </code>
                  <button
                    onClick={copyLink}
                    className={`p-2 rounded-lg transition-colors ${
                      copied
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-[#7F0404] hover:bg-[#6a0303]'
                    }`}
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Copy className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Reminder */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-800 font-medium">
                      Share with your cashier:
                    </p>
                    <ul className="text-amber-700 mt-2 space-y-1">
                      <li>• The invite link above</li>
                      <li>
                        • Password:{' '}
                        <code className="bg-amber-100 px-2 py-0.5 rounded text-amber-800">
                          {password}
                        </code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDone}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 border border-gray-900 rounded-xl font-medium transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            // Form State
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cashier Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter cashier's name"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                    disabled={state === 'submitting'}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cashier@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                    disabled={state === 'submitting'}
                  />
                </div>
              </div>

              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name <span className="text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g., San Pedro Branch"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                    disabled={state === 'submitting'}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-4">
                  Set login credentials for this cashier:
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                    disabled={state === 'submitting'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                    disabled={state === 'submitting'}
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  💡 You'll need to share this password with your cashier along
                  with the invite link.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={state === 'submitting'}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 border border-gray-900 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {state === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account & Invite...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Invite
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
