// apps/web/app/verify-email/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Mail,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    setEmail(emailParam || storedEmail || '');
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!email) {
      setError('No email found. Please sign up again.');
      return;
    }

    if (countdown > 0) return;

    setIsResending(true);
    setError('');
    setResendSuccess(false);

    try {
      const supabase = createClient();

      console.log('Resending verification to:', email);

      // First check if user exists and is not confirmed
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      console.log('Resend result:', { error: resendError });

      if (resendError) {
        const msg = resendError.message.toLowerCase();

        if (
          msg.includes('rate') ||
          msg.includes('limit') ||
          msg.includes('seconds')
        ) {
          setError('Please wait 60 seconds before requesting another email.');
          setCountdown(60);
        } else if (
          msg.includes('already confirmed') ||
          msg.includes('already registered')
        ) {
          setError('This email is already verified. Please login instead.');
          setTimeout(() => router.push('/login'), 2000);
        } else {
          setError(resendError.message);
        }
        return;
      }

      setResendSuccess(true);
      setCountdown(60);
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : 'your email';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
          {/* Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-pulse" />
            <div className="relative w-20 h-20 bg-linear-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Check your inbox
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We sent a verification link to{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {maskedEmail}
            </span>
          </p>

          {/* Success */}
          {resendSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Email sent! Check your inbox.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 mb-6 text-left">
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                Open your email inbox
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                Find email from LoyaltyHub
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                Click "Verify Email Address"
              </li>
            </ol>
          </div>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={isResending || countdown > 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold text-gray-700 dark:text-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isResending ? (
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
                Resend verification email
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mb-6">
            Check spam folder if you don't see it
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
