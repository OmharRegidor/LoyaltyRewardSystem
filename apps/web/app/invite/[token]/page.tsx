// apps/web/app/invite/[token]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import type { Database } from '../../../../../packages/shared/types/database';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Building2,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  LogIn,
} from 'lucide-react';

type AcceptInviteReturn =
  Database['public']['Functions']['accept_staff_invite']['Returns'];

type PageStatus = 'loading' | 'ready' | 'submitting' | 'success' | 'error';

interface InviteData {
  id: string;
  email: string;
  name: string;
  role: string;
  branch_name: string | null;
  business_name: string;
  business_id: string;
  status: string;
  expires_at: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<PageStatus>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadInvite();
  }, [token]);

  const loadInvite = async () => {
    const supabase = createClient();

    try {
      // Fetch invite data
      const { data: inviteData, error: inviteError } = await supabase
        .from('staff_invites')
        .select(
          'id, email, name, role, branch_name, status, expires_at, business_id'
        )
        .eq('token', token)
        .maybeSingle();

      if (inviteError) {
        console.error('Invite fetch error:', inviteError);
        setError('Failed to load invite. Please try again.');
        setStatus('error');
        return;
      }

      if (!inviteData) {
        setError('This invite link is invalid or has been deleted.');
        setStatus('error');
        return;
      }

      // Fetch business name separately
      const { data: businessData } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', inviteData.business_id)
        .single();

      const businessName = businessData?.name || 'Unknown Business';

      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError(
          'This invite has expired. Please ask your employer for a new invite link.'
        );
        setStatus('error');
        return;
      }

      // Check if cancelled
      if (inviteData.status === 'cancelled') {
        setError(
          'This invite has been cancelled. Please contact your employer.'
        );
        setStatus('error');
        return;
      }

      // If already accepted, show message to go to staff login
      if (inviteData.status === 'accepted') {
        setInvite({
          ...inviteData,
          business_name: businessName,
        });
        setError(
          'This invite has already been accepted. Please log in to continue.'
        );
        setStatus('error');
        return;
      }

      setInvite({
        ...inviteData,
        business_name: businessName,
      });
      setStatus('ready');
    } catch (err) {
      console.error('Error loading invite:', err);
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleSignInAndAccept = async () => {
    if (!invite || !password) {
      setError('Please enter your password');
      return;
    }

    setStatus('submitting');
    setError('');

    const supabase = createClient();

    try {
      // Step 1: Sign in with the password set by owner
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: invite.email,
          password: password,
        });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError(
            'Incorrect password. Please use the password given by your employer.'
          );
        } else {
          setError(signInError.message);
        }
        setStatus('ready');
        return;
      }

      if (!signInData.user) {
        setError('Login failed. Please try again.');
        setStatus('ready');
        return;
      }

      // Step 2: Accept the invite
      const { data, error: rpcError } = await supabase.rpc(
        'accept_staff_invite',
        {
          p_token: token,
          p_user_id: signInData.user.id,
        }
      );

      if (rpcError) {
        console.error('Accept invite error:', rpcError);
        // If already accepted, just redirect
        if (rpcError.message.includes('already')) {
          router.push('/staff');
          return;
        }
        setError(rpcError.message);
        setStatus('ready');
        return;
      }

      const result = data as any;

      if (!result?.success) {
        // If already member, just redirect
        if (
          result?.error?.includes('already') ||
          result?.message?.includes('already')
        ) {
          router.push('/staff');
          return;
        }
        setError(result?.error || 'Failed to accept invite. Please try again.');
        setStatus('ready');
        return;
      }

      // Success!
      setStatus('success');
      setTimeout(() => {
        router.push('/staff');
      }, 2000);
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Something went wrong. Please try again.');
      setStatus('ready');
    }
  };

  // Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200 shadow-xl">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {invite?.status === 'accepted'
                ? 'Already Accepted'
                : 'Invalid Invite'}
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/30"
            >
              <LogIn className="w-5 h-5" />
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200 shadow-xl">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to the Team! 🎉
            </h1>
            <p className="text-gray-600 mb-2">
              You've joined{' '}
              <span className="text-primary font-semibold">
                {invite?.business_name}
              </span>
            </p>
            {invite?.branch_name && (
              <p className="text-gray-500 text-sm mb-4">
                Branch: {invite.branch_name}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span>Opening scanner...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ready State - Sign In Form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You're Invited!
            </h1>
            <p className="text-gray-600">
              Join the team at{' '}
              <span className="text-primary font-medium">
                {invite?.business_name}
              </span>
            </p>
          </div>

          {/* Invite Details */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4 mb-6 space-y-3 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Name
                </p>
                <p className="text-gray-900 font-medium">{invite?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Role
                </p>
                <p className="text-gray-900 font-medium capitalize">
                  {invite?.role}
                </p>
              </div>
            </div>

            {invite?.branch_name && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Branch
                  </p>
                  <p className="text-gray-900 font-medium">{invite.branch_name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-600 border-2 border-gray-200">
              {invite?.email}
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password{' '}
              <span className="text-gray-500">(given by your employer)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                disabled={status === 'submitting'}
                onKeyDown={(e) => e.key === 'Enter' && handleSignInAndAccept()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSignInAndAccept}
            disabled={status === 'submitting' || !password}
            className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 hover:shadow-lg shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Sign In & Accept Invite
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm mb-2">
              Already accepted your invite?
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
            >
              <LogIn className="w-4 h-4" />
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
