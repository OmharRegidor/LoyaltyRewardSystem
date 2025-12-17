// apps/web/app/auth/callback/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get('token_hash');
        const type = params.get('type');
        const code = params.get('code');
        const error = params.get('error');
        const errorDesc = params.get('error_description');

        console.log('=== AUTH CALLBACK ===');
        console.log('token_hash:', tokenHash);
        console.log('type:', type);
        console.log('code:', code);
        console.log('error:', error);

        // Handle error param
        if (error) {
          setStatus('error');
          setMessage(errorDesc || 'Verification failed');
          return;
        }

        // Method 1: Token hash (OTP verification) - RECOMMENDED
        if (tokenHash && type) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'email',
          });

          if (verifyError) {
            console.error('Verify OTP error:', verifyError);
            setStatus('error');
            setMessage('Verification link expired. Please request a new one.');
            return;
          }

          if (data.user) {
            await setupAccount(supabase, data.user);
            return;
          }
        }

        // Method 2: Code exchange (PKCE) - fallback
        if (code) {
          try {
            const { data, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              console.error('Exchange error:', exchangeError);
              // Try OTP as fallback
              setStatus('error');
              setMessage(
                'Link expired. Please request a new verification email.'
              );
              return;
            }

            if (data.user) {
              await setupAccount(supabase, data.user);
              return;
            }
          } catch (e) {
            console.error('Code exchange failed:', e);
          }
        }

        // Method 3: Check if already authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await setupAccount(supabase, user);
          return;
        }

        // No valid auth found
        setStatus('error');
        setMessage('Invalid verification link. Please sign up again.');
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    const setupAccount = async (supabase: any, user: any) => {
      try {
        setMessage('Setting up your account...');

        // Check if business exists
        const { data: existingBiz } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!existingBiz) {
          // Create business
          const name = user.user_metadata?.business_name || 'My Business';

          const { data: newBiz, error: bizErr } = await supabase
            .from('businesses')
            .insert({
              owner_id: user.id,
              name,
              points_per_purchase: 10,
            })
            .select()
            .single();

          if (bizErr && bizErr.code !== '23505') {
            console.error('Business creation error:', bizErr);
          }

          // Create staff record
          if (newBiz) {
            try {
              await supabase.rpc('insert_staff_record', {
                p_user_id: user.id,
                p_business_id: newBiz.id,
                p_role: 'owner',
                p_name: name,
                p_email: user.email,
              });
            } catch (staffErr) {
              console.error('Staff error (non-fatal):', staffErr);
            }
          }
        }

        // Clear stored email
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingVerificationEmail');
        }

        setStatus('success');
        setMessage('Email verified! Redirecting to dashboard...');

        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } catch (err) {
        console.error('Setup error:', err);
        setStatus('error');
        setMessage('Account setup failed. Please try logging in.');
      }
    };

    // Run after small delay
    setTimeout(handleCallback, 100);
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        {/* Icon */}
        <div
          className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            status === 'loading'
              ? 'bg-linear-to-br from-blue-500 to-cyan-500'
              : status === 'success'
              ? 'bg-linear-to-br from-green-500 to-emerald-500'
              : 'bg-linear-to-br from-red-500 to-rose-500'
          }`}
        >
          {status === 'loading' && (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-10 h-10 text-white" />
          )}
          {status === 'error' && <XCircle className="w-10 h-10 text-white" />}
        </div>

        {/* Title */}
        <h1
          className={`text-2xl font-bold mb-3 ${
            status === 'success'
              ? 'text-green-600'
              : status === 'error'
              ? 'text-red-600'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {status === 'loading' && 'Verifying...'}
          {status === 'success' && 'Success! 🎉'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        {/* Loading bar */}
        {status === 'loading' && (
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-linear-to-r from-blue-500 to-cyan-500 animate-pulse w-2/3" />
          </div>
        )}

        {/* Error actions */}
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = '/login')}
              className="w-full py-3.5 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Go to Login
            </button>
            <button
              onClick={() => (window.location.href = '/signup')}
              className="w-full py-3.5 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Sign Up Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
