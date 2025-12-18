// apps/web/app/invite/[token]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { acceptInvite } from '@/lib/staff';

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<
    'loading' | 'login-required' | 'accepting' | 'success' | 'error'
  >('loading');
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkInvite();
  }, [token]);

  const checkInvite = async () => {
    const supabase = createClient();

    // Check if invite exists and is valid
    const { data: invite, error: inviteError } = await supabase
      .from('staff_invites')
      .select('*, businesses(name)')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      setStatus('error');
      setError('This invite link is invalid or has expired.');
      return;
    }

    setInviteData(invite);

    // Check if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus('login-required');
      return;
    }

    // Check if user's email matches invite
    if (user.email !== invite.email) {
      setStatus('error');
      setError(
        `This invite was sent to ${invite.email}. Please login with that email.`
      );
      return;
    }

    // Accept the invite
    await handleAccept();
  };

  const handleAccept = async () => {
    setStatus('accepting');

    const result = await acceptInvite(token);

    if (!result.success) {
      setStatus('error');
      setError(result.error || 'Failed to accept invite');
      return;
    }

    setStatus('success');

    // Redirect based on role
    setTimeout(() => {
      if (result.data.role === 'cashier') {
        router.push('/staff');
      } else {
        router.push('/dashboard');
      }
    }, 2000);
  };

  const handleSignUp = () => {
    // Store invite token and redirect to signup
    localStorage.setItem('pendingInviteToken', token);
    router.push(`/signup?invite=${token}&email=${inviteData?.email || ''}`);
  };

  const handleLogin = () => {
    localStorage.setItem('pendingInviteToken', token);
    router.push(`/login?redirect=/invite/${token}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Checking invite...
            </p>
          </>
        )}

        {status === 'login-required' && inviteData && (
          <>
            <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-cyan-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You're Invited!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              <span className="font-semibold">
                {(inviteData.businesses as any)?.name}
              </span>{' '}
              has invited you to join as a{' '}
              <span className="font-semibold capitalize">
                {inviteData.role}
              </span>
              .
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSignUp}
                className="w-full py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Create Account
              </button>
              <button
                onClick={handleLogin}
                className="w-full py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                I Already Have an Account
              </button>
            </div>
          </>
        )}

        {status === 'accepting' && (
          <>
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Joining team...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to the Team!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting you to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invite Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
