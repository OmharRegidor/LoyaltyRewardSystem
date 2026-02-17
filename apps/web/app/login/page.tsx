// apps/web/app/login/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Award,
  TrendingUp,
  Users,
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from 'lucide-react';

// ============================================
// LOGIN FORM COMPONENT (uses useSearchParams)
// ============================================

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for error/redirect params
  const urlError = searchParams.get('error');
  const redirectTo = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const supabase = createClient();

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else {
          setError(signInError.message);
        }
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError('Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Handle "Remember Me"
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      // Check if user is business owner
      const { data: business } = await supabase
        .from('businesses')
        .select('id, subscription_status')
        .eq('owner_id', data.user.id)
        .maybeSingle();

      if (business) {
        // Track login (fire-and-forget)
        fetch('/api/auth/track-login', { method: 'POST' }).catch(() => {});
        // Business owner - go to dashboard (or requested redirect)
        const destination = redirectTo || '/dashboard';
        window.location.replace(destination);
        return;
      }

      // Check if user is staff (NOT an owner)
      const { data: staff } = await supabase
        .from('staff')
        .select('id, role, is_active, business_id')
        .eq('user_id', data.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staff) {
        // Track login (fire-and-forget)
        fetch('/api/auth/track-login', { method: 'POST' }).catch(() => {});
        // Staff member - go to staff page
        window.location.replace('/staff');
        return;
      }

      // Not owner and not staff - this is a customer trying web login
      setError(
        'This login is for business accounts only. Please use the mobile app.',
      );
      await supabase.auth.signOut();
      setIsLoading(false);
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Display error from URL params
  const getDisplayError = () => {
    if (error) return error;
    if (urlError === 'unauthorized')
      return 'You do not have permission to access that page.';
    if (urlError === 'deactivated')
      return 'Your account has been deactivated. Contact your manager.';
    if (urlError === 'session_expired')
      return 'Your session has expired. Please sign in again.';
    return '';
  };

  // Add success message handler
  const urlMessage = searchParams.get('message');
  const getSuccessMessage = () => {
    if (urlMessage === 'email_verified')
      return 'Email verified successfully! Please sign in to continue.';
    if (urlMessage === 'password_reset')
      return 'Password reset successfully! Please sign in with your new password.';
    return '';
  };

  const displayError = getDisplayError();
  const successMessage = getSuccessMessage();

  return (
    <div className="w-full max-w-md">
      <div className="mb-10">
        <h2 className="text-4xl font-bold mb-3 text-gray-900">
          Sign in to your account
        </h2>
        <p className="text-gray-600 text-lg">
          Access your dashboard and manage your loyalty program
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {displayError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800 dark:text-black-200">
              {displayError}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold mb-2 text-gray-700"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 placeholder-gray-400"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold mb-2 text-gray-700"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-gray-300 text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
              Remember me!
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white rounded-xl py-4 font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Logging in...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Log in <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-500 font-medium">
          or
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Sign Up Link */}
      <p className="text-center text-gray-600">
        Don't have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

// ============================================
// LOADING FALLBACK
// ============================================

function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// ============================================
// AUTH REDIRECT GUARD (checks session before showing login)
// ============================================

function AuthRedirectGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkExistingSession = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsCheckingAuth(false);
        return;
      }

      // Check if business owner
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (business) {
        router.replace(redirectTo || '/dashboard');
        return;
      }

      // Check if active staff
      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staff) {
        router.replace('/staff');
        return;
      }

      // Customer on web — stay on login page
      setIsCheckingAuth(false);
    };

    checkExistingSession();
  }, [router, redirectTo]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthRedirectGuard>
        <LoginPageContent />
      </AuthRedirectGuard>
    </Suspense>
  );
}

// ============================================
// LOGIN PAGE CONTENT (brand panel + form)
// ============================================

function LoginPageContent() {
  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Track Engagement',
      description: 'Monitor customer loyalty metrics in real-time',
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Award Points',
      description: 'Instantly reward your loyal customers',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Analyze Behavior',
      description: 'Understand trends and customer patterns',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex">
      {/* Left Side - Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary to-red-600">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div
            className="absolute top-20 left-20 w-72 h-72 bg-secondary/20 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-300/20 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
            style={{ animationDuration: '5s', animationDelay: '2s' }}
          />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-20 w-full">
          <div className="absolute top-8 left-8 z-20">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
          </div>
          <div className="mb-12 transform hover:scale-105 transition-transform duration-300">
            <h1 className="text-6xl font-bold mb-4 text-white leading-tight">
              Welcome back to
              <br />
              <span className="text-secondary drop-shadow-sm">
                NoxaLoyalty
              </span>
            </h1>
            <p className="text-xl text-white/80 max-w-lg leading-relaxed">
              Manage your loyalty program and grow your business with powerful
              analytics and customer insights.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:translate-x-2 border border-white/20 shadow-lg hover:shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/90 flex items-center justify-center text-secondary-foreground group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-1">10K+</div>
                <div className="text-sm text-white/70">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-1">99.9%</div>
                <div className="text-sm text-white/70">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-1">24/7</div>
                <div className="text-sm text-white/70">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-20 sm:px-6 lg:px-16" style={{ backgroundColor: '#ffffff' }}>
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
