'use client';

import { ArrowRight, BarChart3, Gift, QrCode, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, type Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { DarkModeToggle } from '@/components/dark-mode-toggle';
import Link from 'next/link';

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
            <Button
              size="lg"
              className="gradient-primary text-primary-foreground rounded-full px-8 h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
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
                  'Customers scan to earn points instantly. No app download required—simple and effective.',
              },
              {
                icon: Gift,
                title: 'Digital Rewards',
                description:
                  'Create custom rewards that drive repeat purchases and increase customer lifetime value.',
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
                  'Your customers scan the unique QR code at checkout using their phone.',
              },
              {
                number: 2,
                title: 'Earns Points',
                description:
                  'Points are automatically added to their loyalty account based on purchase amount.',
              },
              {
                number: 3,
                title: 'Redeems Rewards',
                description:
                  'Customers redeem earned points for rewards you create and manage.',
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
      <section
        id="pricing"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 dark:bg-muted/10"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your business
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '₱0',
                period: 'forever free',
                description: 'Perfect for getting started',
                features: [
                  'Up to 100 customers',
                  '1 location',
                  'Basic QR code rewards',
                  'Email support',
                  'Manual reports',
                ],
                cta: 'Get Started',
                highlighted: false,
              },
              {
                name: 'Growth',
                price: '₱999',
                period: '/month',
                description: 'For scaling businesses',
                features: [
                  'Unlimited customers',
                  'Multiple locations',
                  'Advanced analytics',
                  'Custom rewards catalog',
                  'Priority support',
                  'API access',
                  'White-label options',
                ],
                cta: 'Start Free Trial',
                highlighted: true,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-secondary shadow-2xl dark:shadow-secondary/20 scale-105'
                    : 'border-border dark:border-border hover:border-secondary/50 dark:hover:border-secondary/40'
                }`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.5, delay: index * 0.1 },
                  },
                }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-secondary text-secondary-foreground text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">
                    {plan.period}
                  </span>
                </div>

                <Button
                  className={`w-full mb-8 rounded-lg h-11 ${
                    plan.highlighted
                      ? 'gradient-primary text-primary-foreground'
                      : 'border border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/5'
                  }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-success shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-muted rounded-full px-8 h-12 font-semibold"
          >
            Start Your Free Trial Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
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
                  <a href="#" className="hover:text-foreground transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
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
