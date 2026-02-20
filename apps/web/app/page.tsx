// apps/web/app/page.tsx
'use client';

import {
  ArrowRight,
  BarChart3,
  Gift,
  QrCode,
  Check,
  Menu,
  X,
  ChevronRight,
  Play,
  Star,
  Users,
  Store,
  TrendingUp,
  Award,
  Zap,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ============================================
// PRICING DATA
// ============================================

interface Plan {
  id: string;
  name: string;
  price: string;
  accentText?: string;
  subtitle: string;
  featuresLabel: string;
  features: string[];
  cta: string;
  href: string;
  filled: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'express',
    name: 'Loyalty Express',
    price: 'Free',
    accentText: 'Limited time offer',
    subtitle: 'Best for small businesses getting started',
    featuresLabel: 'Includes:',
    features: [
      'Earn and Redeem Points',
      'Unlimited Customers',
      'Staff Management (up to 5)',
      'Up to 3 Branches',
      'Analytics Dashboard',
      'QR Code System',
      'Email Support',
    ],
    cta: 'Create Free Account',
    href: '/signup',
    filled: true,
  },
  {
    id: 'premium',
    name: 'Loyalty Premium',
    price: 'Contact for Pricing',
    subtitle: 'Best for growing multi-location businesses',
    featuresLabel: 'Includes everything in Express, plus:',
    features: [
      'Booking System',
      'POS System',
      'Unlimited Branches',
      'Unlimited Staff',
      'Priority Support',
      'Custom Integrations',
      'Dedicated Account Manager',
    ],
    cta: 'Schedule a Demo',
    href: '/book-call',
    filled: false,
  },
];

// ============================================
// NAV LINKS DATA
// ============================================

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

// ============================================
// MOBILE BOTTOM SHEET MENU COMPONENT
// ============================================

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileBottomSheet({ isOpen, onClose }: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNavClick = (href: string) => {
    onClose();
    // Small delay to allow menu to close before scrolling
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 dark:bg-gray-900/98 backdrop-blur-xl border-t border-border rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Menu Header with Centered Logo */}
            <div className="px-6 pb-4 border-b border-border relative bg-primary">
              {/* Close Button - Absolute positioned right */}
              <button
                onClick={onClose}
                className="absolute right-4 top-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Centered Logo */}
              <div className="flex flex-col items-center justify-center gap-2">
                <Image
                  src="/logoloyalty.png"
                  alt="NoxaLoyalty"
                  width={48}
                  height={48}
                  className="h-12 w-auto object-contain brightness-0 invert"
                />
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-white">
                    NoxaLoyalty
                  </span>
                  <span className="text-xs text-white/70">
                    Rewards Platform
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="px-4 py-4">
              {NAV_LINKS.map((link, index) => (
                <motion.button
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleNavClick(link.href)}
                  className="w-full flex items-center justify-between px-4 py-4 text-lg font-semibold text-foreground hover:bg-muted rounded-xl transition-colors group"
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="px-6 pb-8 pt-4 border-t border-border space-y-3">
              <Link href="/signup" onClick={onClose} className="block">
                <Button className="w-full h-14 text-base font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-xl shadow-lg">
                  Sign Up - It's Free!
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login" onClick={onClose} className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-bold rounded-xl border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                >
                  Log in
                </Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// HEADER/NAVBAR COMPONENT
// ============================================

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* LEFT: Logo - Always Visible */}
            <a
              href="#home"
              className="group relative flex items-center shrink-0"
            >
              <div className="relative flex items-center gap-2 sm:gap-3 py-1">
                <Image
                  src="/logoloyalty.png"
                  alt="Noxa Tech Loyalty"
                  width={200}
                  height={64}
                  className="h-10 sm:h-14 lg:h-16 w-auto object-contain hover:scale-105 transition-all duration-300 relative z-10 drop-shadow-sm"
                  priority
                />

                {/* Brand Text - Always Visible */}
                <div className="flex flex-col justify-center border-l border-white/30 pl-2 sm:pl-3">
                  <span className="text-md md:text-md font-bold leading-tight text-white">
                    NoxaLoyalty
                  </span>
                </div>
              </div>
            </a>

            {/* CENTER: Navigation Links - Hidden on mobile/tablet, shown on lg+ */}
            <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="text-sm font-bold transition-colors relative group px-2 py-1 text-white/90 hover:text-white"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </nav>

            {/* RIGHT: CTA Buttons (Desktop) + Hamburger (Mobile/Tablet) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop Auth Buttons - Hidden on mobile/tablet */}
              <div className="hidden lg:flex items-center gap-3">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="transition-all font-bold text-sm px-4 text-white/90 hover:text-white hover:bg-white/10"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-secondary text-secondary-foreground rounded-lg px-6 h-10 shadow-lg hover:shadow-xl hover:scale-105 hover:bg-secondary/90 transition-all font-bold text-sm">
                    Sign Up - It's Free!
                  </Button>
                </Link>
              </div>

              {/* Mobile/Tablet Hamburger Button - Shown below lg */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors bg-white/10 border border-white/20 hover:bg-white/20"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Sheet Menu */}
      <MobileBottomSheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}

// ============================================
// PRICING SECTION COMPONENT
// ============================================

function PricingSection({
  containerVariants,
}: {
  containerVariants: Variants;
}) {
  return (
    <section
      id="pricing"
      className="py-20 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-gray-900">
            Pricing Plans
          </h2>
        </motion.div>

        <div className="flex flex-col md:flex-row items-stretch gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`flex-1 flex flex-col rounded-2xl shadow-md border border-gray-200 bg-white p-8 ${
                plan.id === 'express' ? 'border-t-[3px] border-t-primary' : ''
              }`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
            >
              {/* Header row: plan name left, price right */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.subtitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold ${plan.id === 'express' ? 'text-2xl' : 'text-lg font-semibold'} text-gray-900`}>
                    {plan.price}
                  </p>
                  {plan.accentText && (
                    <p className="text-sm font-medium text-primary mt-0.5">
                      {plan.accentText}
                    </p>
                  )}
                </div>
              </div>

              <hr className="border-gray-200 my-6" />

              {/* Features */}
              <p className="text-sm font-semibold text-gray-900 mb-4">
                {plan.featuresLabel}
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA pushed to bottom */}
              <div className="mt-auto">
                <Link href={plan.href}>
                  {plan.filled ? (
                    <Button className="w-full h-12 rounded-lg font-semibold text-base bg-primary text-white hover:bg-primary/90">
                      {plan.cta}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-lg font-semibold text-base border-2 border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      {plan.cta}
                    </Button>
                  )}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-8 text-center">
          No credit card required for free plan
        </p>
      </div>
    </section>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

const ROTATING_WORDS = [
  'Loyal Fans',
  'Repeat Buyers',
  'Brand Advocates',
  'Raving Regulars',
];
const TYPING_SPEED = 55;
const DELETING_SPEED = 35;
const HOLD_DURATION = 2000;
const PAUSE_BETWEEN = 200;

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentWord = ROTATING_WORDS[wordIndex];

    if (isPaused) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, HOLD_DURATION);
      return () => clearTimeout(timeout);
    }

    if (isDeleting) {
      if (displayText.length === 0) {
        const timeout = setTimeout(() => {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
        }, PAUSE_BETWEEN);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
      }, DELETING_SPEED);
      return () => clearTimeout(timeout);
    }

    if (displayText.length === currentWord.length) {
      setIsPaused(true);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText(currentWord.slice(0, displayText.length + 1));
    }, TYPING_SPEED);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, isPaused, wordIndex]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* Header/Navbar */}
      <Header />

      {/* Hero Section - Split Layout */}
      <section
        id="home"
        className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-secondary/10" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-1/3 w-72 h-72 bg-secondary/8 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_0.85fr] gap-12 lg:gap-16 items-center">
            {/* Left Column - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="text-gray-900">Turn First-Time</span>
                <br />
                <span className="text-gray-900">Customers Into</span>
                <br />
                <span className="text-secondary inline-flex items-baseline min-w-[280px] sm:min-w-[380px] lg:min-w-[460px]">
                  {displayText}
                  <span
                    className={`inline-block w-[3px] h-[0.85em] bg-secondary ml-0.5 rounded-sm ${
                      isPaused && !isDeleting ? 'animate-blink' : ''
                    }`}
                  />
                </span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg leading-relaxed"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                The all-in-one loyalty platform for Philippine small businesses.
                QR code points, digital rewards, and customer insights — free
                forever.
              </motion.p>

              {/* Dual CTAs */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 mb-10"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground rounded-lg px-8 h-13 shadow-lg hover:shadow-xl hover:scale-105 hover:bg-primary/90 transition-all font-bold text-base gap-2"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/book-call">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-lg px-8 h-13 border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary transition-all font-bold text-base gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Book a Demo
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                className="flex flex-wrap gap-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {[
                  { icon: Store, label: '10,000+ Businesses' },
                  { icon: Star, label: '4.8 Rating' },
                  { icon: Zap, label: 'Limited Time Offer' },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2 text-sm text-gray-500"
                  >
                    <badge.icon className="w-4 h-4 text-primary/70" />
                    <span className="font-medium">{badge.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Column - Dashboard Mockup */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            >
              <div className="relative lg:-rotate-1 lg:hover:rotate-0 transition-transform duration-500">
                {/* Main dashboard card */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden">
                  {/* Dashboard header */}
                  <div className="bg-primary px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                    </div>
                    <span className="text-white/80 text-xs font-medium">
                      NoxaLoyalty Dashboard
                    </span>
                    <div className="w-16" />
                  </div>

                  {/* Dashboard content */}
                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Stat cards row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: 'Total Customers',
                          value: '2,847',
                          change: '+12%',
                          icon: Users,
                        },
                        {
                          label: 'Points Issued',
                          value: '45.2K',
                          change: '+8%',
                          icon: Award,
                        },
                        {
                          label: 'Active Rewards',
                          value: '18',
                          change: '+3',
                          icon: Gift,
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-gray-50 rounded-xl p-3 sm:p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <stat.icon className="w-4 h-4 text-primary/60" />
                            <span className="text-xs text-green-600 font-medium">
                              {stat.change}
                            </span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-gray-900">
                            {stat.value}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Chart placeholder */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">
                          Customer Growth
                        </span>
                        <span className="text-xs text-gray-400">
                          Last 7 days
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 h-16">
                        {[40, 55, 45, 65, 50, 75, 85].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-primary/20 rounded-t-sm relative overflow-hidden"
                            style={{ height: `${h}%` }}
                          >
                            <div
                              className="absolute bottom-0 inset-x-0 bg-primary rounded-t-sm"
                              style={{ height: `${h * 0.7}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent activity */}
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Recent Activity
                      </span>
                      <div className="mt-2 space-y-2">
                        {[
                          {
                            name: 'Maria S.',
                            action: 'earned 150 points',
                            time: '2m ago',
                          },
                          {
                            name: 'Juan D.',
                            action: 'redeemed Free Coffee',
                            time: '5m ago',
                          },
                          {
                            name: 'Ana L.',
                            action: 'joined loyalty program',
                            time: '12m ago',
                          },
                        ].map((activity) => (
                          <div
                            key={activity.name}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">
                                  {activity.name[0]}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-800">
                                  {activity.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {' '}
                                  {activity.action}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">
                              {activity.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating accent card */}
                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 hidden lg:flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">+27%</p>
                    <p className="text-xs text-gray-500">Return visits</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="py-16">
        <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
          Who We Work With
        </h2>

        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          }}
        >
          <div className="flex w-max animate-marquee">
            {[0, 1].map((setIndex) => (
              <div key={setIndex} className="flex shrink-0 gap-32 px-16">
                {Array.from({ length: 3 }, () => [
                  {
                    name: 'BiNuKboK VieW PoiNt ReSoRT',
                    src: '/binukbok-logo.png',
                  },
                  { name: 'Jaza Media', src: '/Jaza-Media-logo.jpg' },
                  { name: 'Noxa', src: '/noxa-tech-company.jpg' },
                  { name: 'Evolvia', src: '/evolvia-logo.png' },
                ])
                  .flat()
                  .map((partner, i) => (
                    <div
                      key={`${setIndex}-${i}`}
                      className="group flex flex-col items-center justify-center bg-white rounded-2xl p-6 shrink-0 cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{
                        width: '140px',
                        height: '140px',
                      }}
                    >
                      <Image
                        src={partner.src}
                        alt={partner.name}
                        width={80}
                        height={80}
                        className="object-contain"
                        style={{ maxWidth: '80px', maxHeight: '80px' }}
                      />
                      <span className="mt-1 text-[10px] font-medium text-gray-600 text-center leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {partner.name}
                      </span>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - White Background */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              Your <span className="text-secondary">Customer Loyalty</span> Secret Weapon
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              More than just a rewards system — tools to truly know and grow your customers.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Phone Mockup */}
            <motion.div
              className="relative flex justify-center"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative w-[280px] sm:w-[300px]">
                {/* Phone frame */}
                <div className="rounded-[2.5rem] border-[6px] border-gray-900 bg-white shadow-2xl overflow-hidden">
                  {/* Notch */}
                  <div className="flex justify-center pt-2 pb-1 bg-gray-900">
                    <div className="w-24 h-5 bg-gray-900 rounded-b-2xl" />
                  </div>

                  {/* App header */}
                  <div className="bg-primary px-5 py-4 flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-sm">NoxaLoyalty</span>
                  </div>

                  {/* Customer profile */}
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Maria Santos</p>
                        <p className="text-xs text-gray-500">1,250 points</p>
                      </div>
                    </div>
                  </div>

                  {/* QR code area */}
                  <div className="px-5 py-5 flex flex-col items-center">
                    <p className="text-xs text-gray-500 mb-3 font-medium">Scan to Earn Points</p>
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                  </div>

                  {/* My Rewards card */}
                  <div className="px-5 pb-5">
                    <div className="bg-secondary/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-semibold text-gray-900">My Rewards</span>
                      </div>
                      <p className="text-xs text-gray-600">Free Coffee — 200 pts away</p>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-secondary rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="flex justify-center pb-2">
                    <div className="w-28 h-1 bg-gray-300 rounded-full" />
                  </div>
                </div>

                {/* Floating accent card */}
                <div className="hidden lg:flex absolute -right-8 top-1/3 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">+150 pts</p>
                    <p className="text-xs text-gray-500">Just earned!</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — Feature Stack */}
            <motion.div
              className="space-y-0"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {[
                {
                  icon: QrCode,
                  title: 'QR Code Points',
                  description:
                    'Scan and earn. Customers collect points with every purchase via our mobile app.',
                },
                {
                  icon: Gift,
                  title: 'Digital Rewards',
                  description:
                    'Create custom rewards that keep customers excited to come back.',
                },
                {
                  icon: BarChart3,
                  title: 'Customer Insights',
                  description:
                    'Track buying patterns, measure loyalty, and make data-driven decisions.',
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className={`flex items-start gap-5 py-6 ${index < 2 ? 'border-b border-gray-200' : ''}`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.15 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{ backgroundColor: '#faf9f7' }}
      >
        <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              How <span className="text-secondary">NoxaLoyalty</span> Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start building customer loyalty in minutes — no complex setup, easy to get started.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {/* Step 1 — Set Up Your Program */}
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              {/* Dashboard mockup */}
              <div className="w-full h-[300px] md:h-[340px] bg-[#f3f1ee] rounded-2xl flex items-center justify-center p-6 shadow-sm mb-6">
                <div className="w-full max-w-[260px]">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden">
                    <div className="bg-primary px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                      </div>
                      <span className="text-white/80 text-[10px] font-medium">Create Reward</span>
                      <div className="w-12" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="text-[10px] font-medium text-gray-500 mb-1 block">Reward Name</label>
                        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 border border-gray-200">
                          Free Coffee
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-gray-500 mb-1 block">Points Required</label>
                        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 border border-gray-200">
                          500 pts
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Available to all customers</span>
                        <div className="w-8 h-4.5 bg-primary rounded-full relative">
                          <div className="absolute right-0.5 top-0.5 w-3.5 h-3.5 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Send notification</span>
                        <div className="w-8 h-4.5 bg-primary rounded-full relative">
                          <div className="absolute right-0.5 top-0.5 w-3.5 h-3.5 bg-white rounded-full" />
                        </div>
                      </div>
                      <button className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-lg">
                        Create Reward
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
                <h3 className="text-lg font-semibold text-gray-900">Set Up Your Program</h3>
              </div>
              <p className="text-gray-600 text-sm text-center max-w-[260px]">
                Create your loyalty program in minutes. Set point rules, design rewards, and invite your staff.
              </p>
            </motion.div>

            {/* Step 2 — Customers Earn Points */}
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Phone mockup */}
              <div className="w-full h-[300px] md:h-[340px] bg-[#f3f1ee] rounded-2xl flex items-center justify-center p-6 shadow-sm mb-6">
              <div className="w-[180px]">
                <div className="rounded-[2.5rem] border-[6px] border-gray-900 bg-white shadow-2xl overflow-hidden">
                  <div className="flex justify-center pt-2 pb-1 bg-gray-900">
                    <div className="w-20 h-4 bg-gray-900 rounded-b-2xl" />
                  </div>
                  <div className="bg-primary px-4 py-3 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-xs">NoxaLoyalty</span>
                  </div>
                  {/* Customer profile bar */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-gray-900">Maria Santos</p>
                        <p className="text-[10px] text-gray-500">1,250 points</p>
                      </div>
                    </div>
                  </div>
                  {/* QR code */}
                  <div className="px-4 py-4 flex flex-col items-center">
                    <p className="text-[10px] text-gray-500 mb-2.5 font-medium">Scan to Earn Points</p>
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <QrCode className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>
                  {/* Success badge */}
                  <div className="px-4 pb-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-800">Scan Successful!</p>
                        <p className="text-[10px] text-green-600">+100 points</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center pb-2">
                    <div className="w-24 h-1 bg-gray-300 rounded-full" />
                  </div>
                </div>
              </div>
              </div>
              {/* Label */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
                <h3 className="text-lg font-semibold text-gray-900">Customers Earn Points</h3>
              </div>
              <p className="text-gray-600 text-sm text-center max-w-[260px]">
                Customers scan a QR code at checkout via the mobile app. Points are added instantly.
              </p>
            </motion.div>

            {/* Step 3 — Watch Your Business Grow */}
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Dashboard mockup */}
              <div className="w-full h-[300px] md:h-[340px] bg-[#f3f1ee] rounded-2xl flex items-center justify-center p-6 shadow-sm mb-6">
                <div className="w-full max-w-[260px]">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden">
                    <div className="bg-primary px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                      </div>
                      <span className="text-white/80 text-[10px] font-medium">Analytics</span>
                      <div className="w-12" />
                    </div>
                    <div className="p-4 space-y-3">
                      {/* Stat cards */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <Users className="w-3.5 h-3.5 text-primary/60" />
                            <span className="text-[10px] text-green-600 font-medium">+18%</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">73%</p>
                          <p className="text-[10px] text-gray-500">Returning</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-primary/60" />
                            <span className="text-[10px] text-green-600 font-medium">+24%</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">+₱42K</p>
                          <p className="text-[10px] text-gray-500">Revenue Impact</p>
                        </div>
                      </div>
                      {/* Bar chart */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-gray-700">Monthly Growth</span>
                          <span className="text-[9px] text-gray-400">Last 12 months</span>
                        </div>
                        <div className="flex items-end gap-1 h-12">
                          {[25, 32, 38, 35, 42, 48, 45, 55, 60, 58, 68, 80].map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-primary/20 rounded-t-sm relative overflow-hidden"
                              style={{ height: `${h}%` }}
                            >
                              <div
                                className="absolute bottom-0 inset-x-0 bg-primary rounded-t-sm"
                                style={{ height: `${h * 0.7}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Rewards redeemed */}
                      <div className="bg-secondary/10 rounded-xl p-3 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Rewards Redeemed</p>
                          <p className="text-[10px] text-gray-600">1,847 this month</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="text-lg font-semibold text-gray-900">Watch Your Business Grow</h3>
              </div>
              <p className="text-gray-600 text-sm text-center max-w-[260px]">
                Track returning customers, measure reward redemptions, and see your loyalty program drive real results.
              </p>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            className="text-center mt-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground rounded-lg px-8 h-13 shadow-lg hover:shadow-xl hover:scale-105 hover:bg-primary/90 transition-all font-bold text-base gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection containerVariants={containerVariants} />

      {/* CTA Section - Primary Gradient for Brand Impact */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#f9fafb' }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary via-primary to-primary/80 rounded-3xl p-12 sm:p-16 text-white relative overflow-hidden shadow-2xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/20 rounded-full blur-2xl" />

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 relative z-10">
            Ready to Transform Your Customer Relationships?
          </h2>
          <p className="text-lg mb-8 text-white/90 relative z-10">
            Join hundreds of small businesses in the Philippines already using
            NoxaLoyalty
          </p>
          <Link href="#pricing">
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full px-8 h-12 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all relative z-10"
            >
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer - White Background */}
      <footer
        className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#ffffff' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-bold text-lg mb-4 text-gray-900">
                NoxaLoyalty
              </h4>
              <p className="text-gray-600 text-sm">
                Loyalty rewards platform for small businesses.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4 text-gray-900">Product</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a
                    href="#features"
                    className="hover:text-gray-900 transition"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-gray-900 transition">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4 text-gray-900">Company</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a
                    href="#features"
                    className="hover:text-gray-900 transition"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-gray-900 transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4 text-gray-900">Legal</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-gray-900 transition"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-gray-900 transition"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>&copy; 2026 NoxaLoyalty. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
