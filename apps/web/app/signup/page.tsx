'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Award,
  TrendingUp,
  Zap,
  Shield,
} from 'lucide-react';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Business Information
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Account Details
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: Agreement
  const [agreed, setAgreed] = useState(false);

  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
  const canProceedStep2 =
    password &&
    confirmPassword &&
    password === confirmPassword &&
    allRequirementsMet;

  const handleNext = () => {
    if (step === 1 && businessName && businessType && phone) {
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!agreed) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    window.location.href = '/dashboard';
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Grow Revenue',
      description: 'Increase repeat purchases by 40% on average',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Easy Setup',
      description: 'Launch your program in under 5 minutes',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security for your data',
    },
  ];

  const stats = [
    {
      value: '10,000+',
      label: 'Active Businesses',
      color: 'from-cyan-400 to-blue-500',
    },
    {
      value: '500K+',
      label: 'Happy Customers',
      color: 'from-blue-400 to-indigo-500',
    },
    {
      value: '₱50M+',
      label: 'Points Issued',
      color: 'from-indigo-400 to-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex">
      {/* Left Side - Enhanced Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-600">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div
            className="absolute top-20 left-20 w-80 h-80 bg-cyan-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
            style={{ animationDuration: '5s' }}
          />
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
            style={{ animationDuration: '7s', animationDelay: '1s' }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-72 h-72 bg-indigo-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '2s' }}
          />
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 py-20 w-full">
          {/* Logo/Brand Area */}
          <div className="mb-12">
            {/* <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-xl transform hover:rotate-12 transition-transform duration-300">
              <Award className="w-10 h-10 text-white" />
            </div> */}
            <h1 className="text-6xl font-bold mb-4 text-white leading-tight">
              Start growing
              <br />
              <span className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent">
                your business
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-lg leading-relaxed mb-10">
              Join thousands of businesses using LoyaltyHub to build customer
              loyalty and drive growth.
            </p>

            {/* Benefit Cards */}
            <div className="space-y-4 mb-12">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="group bg-white/10 backdrop-blur-md rounded-2xl p-5 hover:bg-white/20 transition-all duration-300 transform hover:translate-x-2 border border-white/20 shadow-lg hover:shadow-2xl"
                  style={{
                    animation: `slideIn 0.6s ease-out ${0.2 + i * 0.15}s both`,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 group"
                style={{
                  animation: `fadeIn 0.6s ease-out ${0.6 + i * 0.1}s both`,
                }}
              >
                <div
                  className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform`}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-blue-100 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="mt-10 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <Shield className="w-6 h-6 text-cyan-300" />
            <div>
              <p className="text-white font-semibold text-sm">
                Trusted by businesses worldwide
              </p>
              <p className="text-blue-100 text-xs">
                SOC 2 certified • GDPR compliant
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-20 sm:px-6 lg:px-16 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Progress Indicator */}
          <div className="mb-10">
            <div className="flex justify-between mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base transition-all duration-300 ${
                      s <= step
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-400'
                    }`}
                  >
                    {s < step ? <Check className="w-6 h-6" /> : s}
                  </div>
                  <span
                    className={`text-xs font-semibold mt-2 transition-colors ${
                      s <= step
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    {['Business', 'Account', 'Confirm'][s - 1]}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress Line */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-500 ease-out"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
              {step === 1 && 'Tell us about your business'}
              {step === 2 && 'Create your account'}
              {step === 3 && "You're all set!"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {step === 1 && "Let's start with your business information"}
              {step === 2 && 'Set up your login credentials'}
              {step === 3 && 'Review and confirm to get started'}
            </p>
          </div>

          {/* Step 1: Business Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
                >
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                  className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="businessType"
                  className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
                >
                  Business Type
                </label>
                <select
                  id="businessType"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-white"
                >
                  <option value="">Select your business type</option>
                  <option value="cafe">Café</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="gym">Gym</option>
                  <option value="spa">Spa</option>
                  <option value="retail">Retail</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
                >
                  Phone Number
                </label>
                <div className="flex">
                  <span className="px-4 py-3.5 rounded-l-xl bg-gray-200 dark:bg-gray-800 border-2 border-r-0 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold">
                    +63
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9123456789"
                    className="flex-1 px-4 py-3.5 rounded-r-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 dark:text-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                  Show password
                </span>
              </label>

              {/* Password Requirements */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-5 border border-blue-100 dark:border-gray-700">
                <p className="text-sm font-bold mb-3 text-gray-900 dark:text-white">
                  Password requirements:
                </p>
                <div className="space-y-2">
                  {[
                    {
                      met: passwordRequirements.length,
                      label: 'At least 8 characters',
                    },
                    {
                      met: passwordRequirements.uppercase,
                      label: 'One uppercase letter',
                    },
                    { met: passwordRequirements.number, label: 'One number' },
                  ].map((req, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          req.met
                            ? 'bg-green-500 scale-110'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        {req.met && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span
                        className={`transition-colors ${
                          req.met
                            ? 'text-gray-900 dark:text-white font-semibold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Agreement */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 border-2 border-blue-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        Business Information
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {businessName} • {businessType}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        Account Details
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  I agree to the{' '}
                  <a
                    href="#"
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="#"
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-10 pt-8 border-t-2 border-gray-200 dark:border-gray-800">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-gray-700 dark:text-gray-300 transition-all"
              >
                Back
              </button>
            )}

            {step < 3 && (
              <button
                onClick={handleNext}
                disabled={
                  step === 1
                    ? !businessName || !businessType || !phone
                    : !canProceedStep2
                }
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl py-4 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleSubmit}
                disabled={!agreed || isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl py-4 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Sign In Link */}
          <p className="text-center text-gray-600 dark:text-gray-400 mt-8">
            Already have an account?{' '}
            <a
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
