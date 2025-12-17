// apps/web/app/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
} from 'lucide-react';
import { loginBusinessOwner } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check for error params (e.g., from middleware redirect)
  const urlError = searchParams.get('error');
  const redirectTo = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('=== LOGIN START ===');

    try {
      const response = await loginBusinessOwner({ email, password });

      console.log('=== LOGIN RESPONSE ===', response);

      if (!response.success) {
        console.log('=== LOGIN FAILED ===', response.error);
        setError(response.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      localStorage.removeItem('pendingVerificationEmail');

      const destination =
        redirectTo || response.data?.redirectTo || '/dashboard';

      console.log('=== REDIRECTING TO ===', destination);

      // Force redirect
      window.location.replace(destination);
    } catch (err: any) {
      console.error('=== LOGIN ERROR ===', err);
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  // Show URL-based errors
  const displayError =
    error ||
    (urlError === 'deactivated'
      ? 'Your account has been deactivated. Contact your manager.'
      : '');

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
      {/* Left Side - Brand Showcase (unchanged) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600">
        {/* ... keep existing left side code ... */}
        <div className="absolute inset-0">
          <div
            className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300/20 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
            style={{ animationDuration: '5s', animationDelay: '2s' }}
          />
        </div>

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

        <div className="relative z-10 flex flex-col justify-center px-16 py-20 w-full">
          <div className="mb-12 transform hover:scale-105 transition-transform duration-300">
            <h1 className="text-6xl font-bold mb-4 text-white leading-tight">
              Welcome back to
              <br />
              <span className="bg-linear-to-r from-cyan-200 to-white bg-clip-text text-transparent">
                LoyaltyHub
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-lg leading-relaxed">
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
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
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
                <div className="text-3xl font-bold text-white mb-1">10K+</div>
                <div className="text-sm text-blue-100">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                <div className="text-sm text-blue-100">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-blue-100">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-20 sm:px-6 lg:px-16 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Access your dashboard and manage your loyalty program
            </p>
          </div>

          {/* Error Alert */}
          {displayError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
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
                className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
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
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
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
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-white"
                  required
                  disabled={isLoading}
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
                  className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                  Remember me
                </span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-xl py-4 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              or
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
