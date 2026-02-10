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
  description: string;
  priceLabel: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
  primaryButton: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for small businesses getting started',
    priceLabel: '₱0',
    period: 'from ₱5000/month',
    features: [
      'Loyalty & Rewards System',
      'Unlimited Customers',
      'Staff Management (up to 5 per branch)',
      'Up to 3 Branches',
      'Analytics Dashboard',
      'QR Code System',
      'Email Support',
    ],
    cta: 'Sign Up Free',
    href: '/signup',
    highlighted: false,
    primaryButton: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For growing businesses',
    priceLabel: 'Contact for Pricing',
    period: '',
    features: [
      'Everything in Free, plus:',
      'Booking System',
      'POS System',
      'Unlimited Branches',
      'Unlimited Staff',
      'Priority Support',
      'Custom Integrations',
      'Dedicated Account Manager',
    ],
    cta: 'Book a Call',
    href: '/book-call',
    highlighted: true,
    primaryButton: false,
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
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Choose the plan that fits your business
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`relative rounded-2xl p-8 border transition-all duration-300 bg-white shadow-md ${
                plan.highlighted
                  ? 'border-primary shadow-2xl md:scale-105'
                  : 'border-gray-200 hover:border-primary/30'
              }`}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: {
                  opacity: 1,
                  scale: plan.highlighted ? 1.05 : 1,
                  transition: { duration: 0.5, delay: index * 0.1 },
                },
              }}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2 text-gray-900">
                {plan.name}
              </h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  {plan.priceLabel}
                </span>
                {plan.period && (
                  <span className="text-gray-500 ml-2">/{plan.period}</span>
                )}
              </div>

              <Link href={plan.href}>
                <Button
                  className={`w-full mb-8 rounded-lg h-12 text-base font-semibold ${
                    plan.primaryButton
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white'
                  }`}
                  variant={plan.primaryButton ? 'default' : 'ghost'}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Target Markets */}
        <motion.div
          className="mt-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <p className="text-gray-600 mb-6">
            Trusted by businesses across the Philippines
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              'Retail Stores',
              'Restaurants & Cafés',
              'Salons & Spas',
              'Hotels & Travel',
            ].map((market) => (
              <span
                key={market}
                className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-600"
              >
                {market}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function Home() {
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

      {/* Hero Section - White Background */}
      <motion.section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8 pt-24"
        style={{ backgroundColor: '#ffffff' }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Subtle Decorative Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-secondary/15 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-gray-100 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-5xl mx-auto text-center z-10">
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-balance mb-6 text-primary"
            variants={containerVariants}
          >
            Turn First-Time Customers Into{' '}
            <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-sm">
              Loyal Fans
            </span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 text-balance max-w-3xl mx-auto leading-relaxed"
            variants={containerVariants}
          >
            Help your small business in the Philippines grow with a modern
            loyalty rewards platform. QR code points, digital rewards, and
            actionable customer insights—all in one place.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={containerVariants}
          >
            <Link href="#pricing">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground rounded-full px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 hover:bg-primary/90 transition-all font-bold"
              >
                View Pricing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

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
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for small businesses
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: 'QR Code Points',
                description:
                  'Just scan and go, customers earn points with every purchase.',
              },
              {
                icon: Gift,
                title: 'Digital Rewards',
                description:
                  'Create custom rewards that keep customers coming back for more.',
              },
              {
                icon: BarChart3,
                title: 'Customer Insights',
                description:
                  'Understand buying patterns, track customer growth, and make data-driven decisions.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group relative p-8 rounded-2xl border border-gray-200 bg-white hover:border-primary/30 hover:shadow-xl transition-all duration-300 shadow-md"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, delay: index * 0.1 },
                  },
                }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <feature.icon className="w-12 h-12 text-primary mb-4 relative z-10" />
                <h3 className="text-xl font-semibold mb-3 relative z-10 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 relative z-10">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Light Gray Background */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: '#f9fafb' }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Three simple steps to start building customer loyalty
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line - Desktop Only */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-primary hidden md:block" />

            {[
              {
                number: 1,
                title: 'Customer Scans QR',
                description:
                  'Customers makes a purchase and shows their QR code from the app or card.',
              },
              {
                number: 2,
                title: 'Earns Points',
                description:
                  'Your team scans the QR code, enter the amount, and points are added instantly.',
              },
              {
                number: 3,
                title: 'Redeems & Enjoy',
                description:
                  'Customer picks a reward, shows their redemptions code, and gets their prize!.',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, delay: index * 0.15 },
                  },
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 relative z-10 shadow-lg">
                    <span className="text-2xl font-bold text-white drop-shadow-sm">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
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
