'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { updatePassword } from '@/lib/auth';
import { createClient } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

type ResetStatus = 'idle' | 'loading' | 'success' | 'error';

// ============================================
// MAIN COMPONENT
// ============================================

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState<ResetStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Password requirements
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const allRequirementsMet = Object.values(requirements).every(Boolean);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRequirementsMet && passwordsMatch;

  // ============================================
  // CHECK SESSION ON MOUNT
  // ============================================

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // User should have a valid session from clicking the reset link
      setIsValidSession(!!session);
    };

    checkSession();
  }, []);

  // ============================================
  // HANDLE PASSWORD RESET
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) return;

    setResetStatus('loading');
    setErrorMessage('');

    try {
      const response = await updatePassword(password);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update password');
      }

      setResetStatus('success');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?message=password_reset');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to reset password'
      );
      setResetStatus('error');
    }
  };

  // ============================================
  // LOADING STATE (Checking Session)
  // ============================================

  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ============================================
  // INVALID SESSION
  // ============================================

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Invalid or Expired Link</h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-medium"
          >
            Back to Login
          </button>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // SUCCESS STATE
  // ============================================

  if (resetStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Password Updated!</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully changed. You can now log in with
            your new password.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Redirecting to login...
          </p>
          <button
            onClick={() => router.push('/login?message=password_reset')}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-medium"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  // ============================================
  // MAIN FORM
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
          <p className="text-muted-foreground">
            Create a strong password for your account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-xl p-6">
          {/* Error Alert */}
          {resetStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  {errorMessage}
                </p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-background"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition"
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
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/20 transition bg-background ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-border focus:border-primary'
                }`}
                placeholder="Confirm new password"
                required
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-red-600 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-2">
              <p className="text-sm font-medium mb-2">Password requirements:</p>
              {[
                { met: requirements.length, label: 'At least 8 characters' },
                { met: requirements.uppercase, label: 'One uppercase letter' },
                { met: requirements.lowercase, label: 'One lowercase letter' },
                { met: requirements.number, label: 'One number' },
              ].map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      req.met ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    {req.met && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span
                    className={
                      req.met
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit || resetStatus === 'loading'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {resetStatus === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Set New Password
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to Login */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Remember your password?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-primary font-medium hover:underline"
          >
            Back to Login
          </button>
        </p>
      </motion.div>
    </div>
  );
}
