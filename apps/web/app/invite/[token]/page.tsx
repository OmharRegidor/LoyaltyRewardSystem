// apps/web/app/invite/[token]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Building2,
  UserPlus,
  LogIn,
  AlertCircle,
} from 'lucide-react';

type InviteStatus =
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'accepting'
  | 'accepted'
  | 'error';

interface InviteData {
  id: string;
  email: string;
  name: string;
  role: string;
  branch_name?: string;
  business_name: string;
  status: string;
  expires_at: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    checkInvite();
  }, [token]);

  const checkInvite = async () => {
    const supabase = createClient();

    try {
      console.log('🔍 Checking invite with token:', token);

      // Check if user is logged in
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch invite - use maybeSingle() to avoid errors on 0 rows
      const { data: inviteData, error: inviteError } = await supabase
        .from('staff_invites')
        .select(
          `
          id,
          email,
          name,
          role,
          branch_name,
          status,
          expires_at,
          business_id,
          businesses (name)
        `
        )
        .eq('token', token)
        .maybeSingle();

      console.log('📦 Invite data:', inviteData);
      console.log('❌ Invite error:', inviteError);

      // Store debug info
      setDebugInfo({
        token,
        inviteData,
        inviteError,
        user: currentUser?.email,
      });

      if (inviteError) {
        setError(inviteError.message);
        setStatus('invalid');
        return;
      }

      if (!inviteData) {
        setError(
          'Invite not found. It may have been deleted or the link is incorrect.'
        );
        setStatus('invalid');
        return;
      }

      // Check if already accepted
      if (inviteData.status === 'accepted') {
        setError('This invite has already been used.');
        setStatus('invalid');
        return;
      }

      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invite has expired. Please ask for a new one.');
        setStatus('invalid');
        return;
      }

      // Check if cancelled
      if (inviteData.status === 'cancelled') {
        setError('This invite has been cancelled.');
        setStatus('invalid');
        return;
      }

      // Get business name from joined data
      const businessName =
        (inviteData.businesses as any)?.name || 'Unknown Business';

      setInvite({
        id: inviteData.id,
        email: inviteData.email,
        name: inviteData.name,
        role: inviteData.role,
        branch_name: inviteData.branch_name ?? undefined,
        business_name: businessName,
        status: inviteData.status,
        expires_at: inviteData.expires_at,
      });

      setStatus('valid');

      // If user is logged in with matching email, auto-accept
      if (
        currentUser &&
        currentUser.email?.toLowerCase() === inviteData.email.toLowerCase()
      ) {
        // Don't auto-accept, let user click the button
        console.log('✅ User email matches invite email');
      }
    } catch (err) {
      console.error('Error checking invite:', err);
      setError('An unexpected error occurred');
      setStatus('error');
    }
  };

  const handleAcceptInvite = async () => {
    if (!user || !invite) return;

    setStatus('accepting');
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc('accept_staff_invite', {
        p_token: token,
        p_user_id: user.id,
      });

      console.log('Accept result:', data, error);

      if (error) {
        setError(error.message);
        setStatus('error');
        return;
      }

      const result = data as {
        success: boolean;
        error?: string;
        role?: string;
      };

      if (!result.success) {
        setError(result.error || 'Failed to accept invite');
        setStatus('error');
        return;
      }

      setStatus('accepted');

      // Redirect based on role
      setTimeout(() => {
        if (result.role === 'cashier') {
          router.push('/staff');
        } else {
          router.push('/dashboard');
        }
      }, 2000);
    } catch (err) {
      console.error('Accept error:', err);
      setError('Failed to accept invite');
      setStatus('error');
    }
  };

  // Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Checking invite...</p>
        </div>
      </div>
    );
  }

  // Invalid/Error State
  if (status === 'invalid' || status === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Invite Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>

            <Link
              href="/login"
              className="block w-full py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
            >
              Go to Login
            </Link>

            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <details className="mt-6 text-left">
                <summary className="text-gray-500 text-sm cursor-pointer">
                  Debug Info
                </summary>
                <pre className="mt-2 p-3 bg-gray-900 rounded-lg text-xs text-gray-400 overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Accepted State
  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome to the Team!
            </h1>
            <p className="text-gray-400 mb-2">
              You've joined{' '}
              <span className="text-white font-medium">
                {invite?.business_name}
              </span>
            </p>
            <p className="text-gray-500 text-sm mb-6">Redirecting you now...</p>
            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Valid Invite State
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-linear-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              You're Invited!
            </h1>
            <p className="text-gray-400">
              Join the team at{' '}
              <span className="text-cyan-400 font-medium">
                {invite?.business_name}
              </span>
            </p>
          </div>

          {/* Invite Details */}
          <div className="bg-gray-700/50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Invited as</p>
                <p className="text-white font-medium">{invite?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Role</p>
                <p className="text-white font-medium capitalize">
                  {invite?.role}
                </p>
              </div>
            </div>
            {invite?.branch_name && (
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Branch</p>
                  <p className="text-white font-medium">{invite.branch_name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {user ? (
            // User is logged in
            user.email?.toLowerCase() === invite?.email.toLowerCase() ? (
              // Email matches - show accept button
              <button
                onClick={handleAcceptInvite}
                disabled={status === 'accepting'}
                className="w-full py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'accepting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Accept & Join Team
                  </>
                )}
              </button>
            ) : (
              // Email doesn't match
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-amber-200 font-medium">
                        Wrong Account
                      </p>
                      <p className="text-amber-200/70 mt-1">
                        This invite is for <strong>{invite?.email}</strong>.
                        You're logged in as <strong>{user.email}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="block w-full py-3 bg-gray-700 text-white text-center rounded-xl font-medium hover:bg-gray-600 transition-colors"
                >
                  Login with Different Account
                </Link>
              </div>
            )
          ) : (
            // User is not logged in
            <div className="space-y-3">
              <p className="text-center text-gray-400 text-sm mb-4">
                Login or create an account with{' '}
                <strong className="text-white">{invite?.email}</strong> to
                accept this invite
              </p>
              <Link
                href={`/signup?email=${encodeURIComponent(
                  invite?.email || ''
                )}&invite=${token}`}
                className="block w-full py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white text-center rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                Create Account
              </Link>
              <Link
                href={`/login?email=${encodeURIComponent(
                  invite?.email || ''
                )}&invite=${token}`}
                className="block w-full py-3 bg-gray-700 text-white text-center rounded-xl font-medium hover:bg-gray-600 transition-colors"
              >
                I Already Have an Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
