// apps/web/components/staff/add-customer-modal.tsx

'use client';

import { useState } from 'react';
import {
  X,
  Send,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

// ============================================
// VALIDATION
// ============================================

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.email.trim()) {
    errors.email = 'Email is required';
    return errors;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email address';
  }

  return errors;
}

// ============================================
// COMPONENT
// ============================================

export function AddCustomerModal({
  isOpen,
  onClose,
  businessName,
}: AddCustomerModalProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (value: string) => {
    setFormData({ email: value });
    if (errors.email) {
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitState('submitting');
    setErrors({});

    try {
      const response = await fetch('/api/staff/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSubmitMessage(
        data.data.alreadyRegistered
          ? `This customer is already registered with ${businessName}.`
          : `Invitation sent! The customer will receive an email to complete their signup.`,
      );
      setSubmitState('success');
    } catch (error) {
      setSubmitMessage(
        error instanceof Error ? error.message : 'Something went wrong',
      );
      setSubmitState('error');
    }
  };

  const handleClose = () => {
    setFormData({ email: '' });
    setErrors({});
    setSubmitState('idle');
    setSubmitMessage('');
    onClose();
  };

  const handleInviteAnother = () => {
    setFormData({ email: '' });
    setErrors({});
    setSubmitState('idle');
    setSubmitMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-[#7F0404]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Invite Customer</h2>
              <p className="text-xs text-white/70">{businessName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {submitState === 'success' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Done!
              </h3>
              <p className="text-gray-500 text-sm mb-6">{submitMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleInviteAnother}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors border border-gray-300"
                >
                  Invite Another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl font-medium transition-colors border border-gray-900"
                >
                  Done
                </button>
              </div>
            </div>
          ) : submitState === 'error' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-500 text-sm mb-6">{submitMessage}</p>
              <button
                onClick={() => setSubmitState('idle')}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors border border-gray-300"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the customer&apos;s email address. They&apos;ll receive an
                invitation to sign up on their own device.
              </p>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="juan@email.com"
                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400/50 transition-all ${
                      errors.email
                        ? 'border-red-500'
                        : 'border-gray-300 focus:border-yellow-400'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-xs text-gray-700">
                  The customer will complete their registration on their own device.
                  Their identity will be verified via email OTP.
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitState === 'submitting'}
                className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gray-900"
              >
                {submitState === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Invitation
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
