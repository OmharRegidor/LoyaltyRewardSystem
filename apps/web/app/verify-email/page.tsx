// apps/web/app/verify-email/page.tsx

'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { resendVerificationEmail } from '@/lib/auth';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  // Get email from URL params or localStorage
  const getStoredEmail = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pendingVerificationEmail') || '';
    }
    return '';
  };

  const handleResend = async () => {
    const email = getStoredEmail();
    if (!email) {
      setError('Email not found. Please sign up again.');
      return;
    }

    setIsResending(true);
    setError('');
    setResendSuccess(false);

    const result = await resendVerificationEmail(email);

    if (result.success) {
      setResendSuccess(true);
    } else {
      setError(result.error || 'Failed to resend email');
    }

    setIsResending(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-linear-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mail className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Verify your email
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            We've sent a verification link to your email address. Please click
            the link to activate your account and access your dashboard.
          </p>

          {/* Success Message */}
          {resendSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Verification email sent! Check your inbox.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              What to do next:
            </p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                Check your email inbox
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                Click the verification link in the email
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                You'll be redirected to your dashboard
              </li>
            </ol>
          </div>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend verification email
              </>
            )}
          </button>

          {/* Spam Notice */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Didn't receive the email? Check your spam folder or click above to
            resend.
          </p>

          {/* Back to Login */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
