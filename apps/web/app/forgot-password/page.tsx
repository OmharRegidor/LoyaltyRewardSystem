// apps/web/app/forgot-password/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/auth';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await requestPasswordReset(email.toLowerCase().trim());

      if (!result.success) {
        setError(result.error || 'Failed to send reset email');
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      setCountdown(60);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      const result = await requestPasswordReset(email.toLowerCase().trim());

      if (!result.success) {
        setError(result.error || 'Failed to resend reset email');
        setIsLoading(false);
        return;
      }

      setResendSuccess(true);
      setCountdown(60);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : 'your email';

  // ============================================
  // CONFIRMATION VIEW (after email sent)
  // ============================================

  if (isSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-200">
            {/* Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <div className="relative w-20 h-20 bg-[#7F0404] rounded-full flex items-center justify-center shadow-lg">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Check your inbox
            </h1>

            <p className="text-gray-600 mb-6">
              We sent a password reset link to{' '}
              <span className="font-semibold text-gray-900">
                {maskedEmail}
              </span>
            </p>

            {/* Success */}
            {resendSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-800">
                  Email sent! Check your inbox.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#7F0404] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  Open your email inbox
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#7F0404] text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  Find email from NoxaLoyalty
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#7F0404] text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  Click &quot;Reset Password&quot;
                </li>
              </ol>
            </div>

            {/* Resend Button */}
            <button
              onClick={handleResend}
              disabled={isLoading || countdown > 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 font-semibold text-gray-900 border border-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend reset email
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mb-6">
              Check spam folder if you don&apos;t see it
            </p>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#7F0404] transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // EMAIL FORM VIEW
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-200">
          {/* Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
            <div className="relative w-20 h-20 bg-[#7F0404] rounded-full flex items-center justify-center shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Forgot your password?
          </h1>

          <p className="text-gray-600 mb-6">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative mb-4">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border-2 border-gray-200 focus:border-[#7F0404] focus:ring-4 focus:ring-[#7F0404]/10 transition-all text-gray-900 placeholder-gray-400"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 font-semibold text-gray-900 border border-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#7F0404] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#7F0404] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
