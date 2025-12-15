// apps/web/app/auth/callback/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { completeSignupAfterVerification } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Get session from URL hash (Supabase puts tokens in URL fragment)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage('Verification failed. The link may have expired.');
          return;
        }

        if (!session) {
          // Try to exchange the code from URL
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              console.error('Set session error:', setSessionError);
              setStatus('error');
              setMessage('Failed to verify session. Please try logging in.');
              return;
            }
          } else {
            setStatus('error');
            setMessage('Invalid verification link. Please request a new one.');
            return;
          }
        }

        // Complete the signup process (create business + staff)
        setMessage('Setting up your account...');
        const result = await completeSignupAfterVerification();

        if (result.success) {
          setStatus('success');
          setMessage('Email verified! Redirecting to dashboard...');

          // Clear stored email
          localStorage.removeItem('pendingVerificationEmail');

          // Redirect after short delay
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1500);
        } else {
          setStatus('error');
          setMessage(
            result.error || 'Failed to complete setup. Please try again.'
          );
        }
      } catch (error: any) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'loading' && (
              <div className="w-16 h-16 mx-auto">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>

          {/* Message */}
          <h1
            className={`text-xl font-bold mb-2 ${
              status === 'error'
                ? 'text-red-600 dark:text-red-400'
                : status === 'success'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {status === 'loading' && 'Please wait...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          <p className="text-gray-600 dark:text-gray-400">{message}</p>

          {/* Error Actions */}
          {status === 'error' && (
            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="w-full px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Sign Up Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
