'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  KeyRound,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { requestPasswordReset } from '@/lib/auth';
import { createClient } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

// ============================================
// MAIN COMPONENT
// ============================================

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);

  // Load user email on mount
  useState(() => {
    const loadEmail = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
      setIsLoadingEmail(false);
    };
    loadEmail();
  });

  // ============================================
  // SEND PASSWORD RESET EMAIL
  // ============================================

  const handleSendResetEmail = async () => {
    if (!userEmail) {
      setErrorMessage('No email found. Please contact support.');
      setRequestStatus('error');
      return;
    }

    setRequestStatus('loading');
    setErrorMessage('');

    try {
      const response = await requestPasswordReset(userEmail);

      if (!response.success) {
        throw new Error(response.error || 'Failed to send reset email');
      }

      setRequestStatus('success');
    } catch (error) {
      console.error('Password reset error:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to send reset email'
      );
      setRequestStatus('error');
    }
  };

  // ============================================
  // ANIMATION VARIANTS
  // ============================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <motion.div
        className="w-full max-w-2xl mx-auto space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Back Button & Header */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Settings</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Security Settings</h1>
              <p className="text-muted-foreground mt-1">
                Manage your account security and password
              </p>
            </div>
          </div>
        </motion.div>

        {/* Password Change Card */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-xl">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Change Password</h2>
                <p className="text-sm text-muted-foreground">
                  Secure your account with a new password
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Idle State - Show Instructions */}
              {requestStatus === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Security Info Box */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          Secure Password Reset
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          For your security, we'll send a password reset link to
                          your email. This ensures only you can change your
                          password.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Email Display */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Mail className="w-4 h-4 inline mr-2 text-muted-foreground" />
                      Reset link will be sent to
                    </label>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                      {isLoadingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Mail className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{userEmail}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      How it works:
                    </p>
                    <div className="space-y-2">
                      {[
                        'Click the button below to request a reset link',
                        'Check your email for the password reset link',
                        'Click the link and set your new password',
                        'Log in with your new password',
                      ].map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">
                              {index + 1}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendResetEmail}
                    disabled={isLoadingEmail || !userEmail}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-semibold disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    <Mail className="w-5 h-5" />
                    Send Password Reset Email
                  </button>
                </motion.div>
              )}

              {/* Loading State */}
              {requestStatus === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="py-12 text-center"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="font-medium">Sending reset email...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please wait a moment
                  </p>
                </motion.div>
              )}

              {/* Success State */}
              {requestStatus === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-8 text-center"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Email Sent!</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    We've sent a password reset link to{' '}
                    <span className="font-medium text-foreground">
                      {userEmail}
                    </span>
                    . Please check your inbox.
                  </p>

                  {/* Email Tips */}
                  <div className="p-4 bg-muted/50 rounded-xl text-left mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Don't see the email?</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• Check your spam or junk folder</li>
                          <li>• Make sure {userEmail} is correct</li>
                          <li>• Wait a few minutes and try again</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setRequestStatus('idle')}
                      className="flex-1 px-4 py-2.5 border border-border rounded-xl hover:bg-muted transition font-medium"
                    >
                      Send Again
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/settings')}
                      className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-medium"
                    >
                      Back to Settings
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Error State */}
              {requestStatus === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-8 text-center"
                >
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Failed to Send</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {errorMessage || 'Something went wrong. Please try again.'}
                  </p>

                  <button
                    onClick={() => setRequestStatus('idle')}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition font-medium"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Security Tips Card */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Lock className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-lg font-bold">Security Tips</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Use a strong password',
                  desc: 'At least 8 characters with uppercase, lowercase, and numbers',
                },
                {
                  title: "Don't reuse passwords",
                  desc: 'Use a unique password for each account',
                },
                {
                  title: 'Keep it private',
                  desc: 'Never share your password with anyone',
                },
                {
                  title: 'Update regularly',
                  desc: 'Change your password every few months',
                },
              ].map((tip, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted/50 rounded-xl border border-border"
                >
                  <p className="font-medium text-sm">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tip.desc}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
