// apps/web/app/page.tsx
'use client';

import { ArrowRight, BarChart3, Gift, QrCode, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, type Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { DarkModeToggle } from '@/components/dark-mode-toggle';
import Link from 'next/link';

// ============================================
// PRICING DATA
// ============================================

const PLANS = [
  {
    id: 'core',
    name: 'Core',
    description: 'Perfect for small to medium businesses',
    priceMonthly: 3499,
    priceAnnual: 34990,
    features: [
      'Up to 3,000 customers',
      'Up to 3 branches',
      '3 staff per branch',
      'QR-based loyalty rewards',
      'Points & stamps system',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Contact Us',
    highlighted: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For growing businesses with multiple locations',
    priceMonthly: 9999,
    priceAnnual: 99990,
    features: [
      'Unlimited customers',
      'Unlimited branches',
      'Unlimited staff',
      'Advanced analytics',
      'API access',
      'Webhooks integration',
      'Custom branding',
      'Priority support',
      'Dedicated account manager',
    ],
    cta: 'Contact Us',
    highlighted: true,
  },
];

// ============================================
// PRICING SECTION COMPONENT
// ============================================

function PricingSection({
  containerVariants,
}: {
  containerVariants: Variants;
}) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>(
    'annual',
  );
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getAnnualSavings = (monthly: number, annual: number): number => {
    const yearlyIfMonthly = monthly * 12;
    return Math.round(((yearlyIfMonthly - annual) / yearlyIfMonthly) * 100);
  };

  // Contact Us Modal
  const ContactModal = () => {
    if (!showContactModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowContactModal(false)}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-primary to-secondary p-6 text-white">
            <h3 className="text-xl font-bold">
              Get Started with {selectedPlan}
            </h3>
            <p className="text-white/80 text-sm mt-1">
              We'll help you set up your account
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-muted-foreground mb-6">
              To get started with LoyaltyHub, please contact us via email with
              your business details.
            </p>

            {/* Steps */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Send us an email</p>
                  <p className="text-xs text-muted-foreground">
                    Include your business name and chosen plan
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    We'll send payment details
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bank transfer or GCash options available
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Account activation</p>
                  <p className="text-xs text-muted-foreground">
                    We'll set up your account within 24 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Email Box */}
            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-2">
                Send your inquiry to:
              </p>
              <a
                href={`mailto:noxa.company@gmail.com?subject=LoyaltyHub ${selectedPlan} Plan Inquiry&body=Hi LoyaltyHub Team,%0D%0A%0D%0AI'm interested in the ${selectedPlan} plan (${billingInterval}).%0D%0A%0D%0ABusiness Name: %0D%0AContact Number: %0D%0A%0D%0AThank you!`}
                className="text-lg font-semibold text-primary hover:underline"
              >
                noxa.company@gmail.com
              </a>
            </div>

            {/* What to Include */}
            <div className="text-xs text-muted-foreground mb-6">
              <p className="font-medium mb-2">Please include in your email:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Business name</li>
                <li>Owner's full name</li>
                <li>Contact number</li>
                <li>
                  Preferred plan:{' '}
                  <span className="font-medium text-foreground">
                    {selectedPlan} ({billingInterval})
                  </span>
                </li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowContactModal(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                onClick={() => {
                  window.location.href = `mailto:support@loyaltyhub.ph?subject=LoyaltyHub ${selectedPlan} Plan Inquiry&body=Hi LoyaltyHub Team,%0D%0A%0D%0AI'm interested in the ${selectedPlan} plan (${billingInterval}).%0D%0A%0D%0ABusiness Name: %0D%0AContact Number: %0D%0A%0D%0AThank you!`;
                }}
              >
                Send Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      id="pricing"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 dark:bg-muted/10"
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choose the plan that fits your business
          </p>

          {/* Billing Interval Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 bg-muted dark:bg-muted/50 rounded-full">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-background dark:bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingInterval === 'annual'
                  ? 'bg-background dark:bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan, index) => {
            const price =
              billingInterval === 'annual'
                ? plan.priceAnnual
                : plan.priceMonthly;
            const period = billingInterval === 'annual' ? '/year' : '/month';
            const savings = getAnnualSavings(
              plan.priceMonthly,
              plan.priceAnnual,
            );

            return (
              <motion.div
                key={plan.id}
                className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-secondary shadow-2xl dark:shadow-secondary/20 md:scale-105'
                    : 'border-border dark:border-border hover:border-secondary/50 dark:hover:border-secondary/40'
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
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-secondary text-secondary-foreground text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-6">{plan.description}</p>

                <div className="mb-2">
                  <span className="text-5xl font-bold">
                    {formatPrice(price)}
                  </span>
                  <span className="text-muted-foreground ml-2">{period}</span>
                </div>

                {billingInterval === 'annual' && (
                  <p className="text-sm text-green-600 dark:text-green-400 mb-6">
                    Save {savings}% compared to monthly
                  </p>
                )}
                {billingInterval === 'monthly' && (
                  <p className="text-sm text-muted-foreground mb-6">
                    or {formatPrice(plan.priceAnnual)}/year (save {savings}%)
                  </p>
                )}

                {/* <Link href={`/checkout/${plan.id}?interval=${billingInterval}`}> */}
                <Button
                  className={`w-full mb-8 rounded-lg h-12 text-base font-semibold ${
                    plan.highlighted
                      ? 'gradient-primary text-primary-foreground hover:opacity-90'
                      : 'border-2 border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/5'
                  }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedPlan(plan.name);
                    setShowContactModal(true);
                  }}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                {/* </Link> */}

                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Target Markets */}
        <motion.div
          className="mt-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <p className="text-muted-foreground mb-6">
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
                className="px-4 py-2 bg-muted/50 dark:bg-muted/30 rounded-full text-sm text-muted-foreground"
              >
                {market}
              </span>
            ))}
          </div>
        </motion.div>
        <ContactModal />
      </div>
    </section>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#home">
            <motion.h1
              className="text-2xl font-bold gradient-primary bg-clip-text text-transparent cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              LoyaltyHub
            </motion.h1>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-foreground hover:bg-muted dark:hover:bg-muted/50 transition-colors"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="gradient-primary text-primary-foreground rounded-lg px-6 h-10 shadow-md hover:shadow-lg hover:scale-105 transition-all">
                Sign Up - It's Free!
              </Button>
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20 sm:px-6 lg:px-8 pt-24"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 dark:bg-primary/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/20 dark:bg-secondary/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-5xl mx-auto text-center z-10">
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance mb-6"
            variants={containerVariants}
          >
            Turn First-Time Customers Into{' '}
            <span className="gradient-primary bg-clip-text text-transparent">
              Loyal Fans
            </span>
          </motion.h1>

          <motion.p
            className="text-xl sm:text-2xl text-muted-foreground mb-8 text-balance max-w-3xl mx-auto leading-relaxed"
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
                className="gradient-primary text-primary-foreground rounded-full px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                View Pricing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12 border-2 hover:bg-muted transition-all bg-transparent"
            >
              See Demo
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 dark:bg-muted/10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                className="group relative p-8 rounded-2xl border border-border bg-card dark:bg-card/50 hover:border-secondary/50 dark:hover:border-secondary/40 hover:shadow-xl dark:hover:shadow-lg transition-all duration-300"
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
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-primary/5 dark:from-primary/10 to-secondary/5 dark:to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <feature.icon className="w-12 h-12 text-primary mb-4 relative z-10" />
                <h3 className="text-xl font-semibold mb-3 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground relative z-10">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to start building customer loyalty
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line - Desktop Only */}
            <div className="absolute top-24 left-0 right-0 h-1 bg-linear-to-r from-primary to-secondary dark:from-secondary dark:to-primary hidden md:block" />

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
                title: 'Redeems  & Enjoy',
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
                  <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 relative z-10 shadow-lg dark:shadow-secondary/20">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection containerVariants={containerVariants} />

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center gradient-primary rounded-3xl p-12 sm:p-16 text-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Transform Your Customer Relationships?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join hundreds of small businesses in the Philippines already using
            LoyaltyHub
          </p>
          <Link href="#pricing">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-muted rounded-full px-8 h-12 font-semibold"
            >
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 dark:bg-muted/10 border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-bold text-lg mb-4">LoyaltyHub</h4>
              <p className="text-muted-foreground text-sm">
                Loyalty rewards platform for small businesses.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Product</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-foreground transition"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Roadmap
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Follow</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 LoyaltyHub. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
