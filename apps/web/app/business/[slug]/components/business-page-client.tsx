// apps/web/app/business/[slug]/components/business-page-client.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  Phone,
  Gift,
  Star,
} from 'lucide-react';
import type { PublicBusiness } from '@/lib/services/public-business.service';

// ============================================
// TYPES
// ============================================

interface BusinessPageClientProps {
  business: PublicBusiness;
  slug: string;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function BusinessPageClient({
  business,
  slug,
}: BusinessPageClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Subtle Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute top-40 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/10 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-muted/50 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Bento Grid Container */}
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainerVariants}
        >
          {/* Main 2-column grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Business Info + Buttons */}
            <motion.div className="flex flex-col gap-4" variants={cardVariants}>
              {/* Logo with glow effect */}
              <motion.div
                className="relative group w-fit"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-linear-to-r from-primary/30 to-secondary/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-110" />

                {business.logo_url ? (
                  <div className="h-[120px] w-[120px] rounded-2xl overflow-hidden relative z-10 shadow-lg">
                    <Image
                      src={business.logo_url}
                      alt={business.name}
                      width={120}
                      height={120}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-secondary/20 relative z-10 shadow-lg">
                    <Building2 className="h-14 w-14 text-primary" />
                  </div>
                )}
              </motion.div>

              {/* Business Name + Badge */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    {business.name}
                  </h1>
                  {business.business_type && (
                    <span className="text-gray-500 text-base sm:text-lg font-normal">
                      {business.business_type}
                    </span>
                  )}
                </div>
                {business.description && (
                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                    {business.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-2">
                <Button
                  variant="outline"
                  asChild
                  size="lg"
                  className="rounded-xl px-4 sm:px-8 h-10 sm:h-12 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold"
                >
                  <Link href={`/business/${slug}/rewards`}>
                    <Gift className="mr-2 h-5 w-5" />
                    View Rewards
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Right Column - Contact + Loyalty stacked */}
            <motion.div className="flex flex-col gap-6" variants={cardVariants}>
              {/* Contact Information Card */}
              <Card className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-primary rounded-2xl bg-white shadow-md border border-gray-100">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="flex items-center gap-3 text-base text-gray-900">
                    <div className="p-2 rounded-xl bg-linear-to-br from-primary to-secondary text-white">
                      <MapPin className="h-4 w-4" />
                    </div>
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 relative pt-0">
                  {(business.address || business.city) && (
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="text-sm">
                        {business.address && (
                          <p className="font-medium text-gray-900">
                            {business.address}
                          </p>
                        )}
                        {business.city && (
                          <p className="text-gray-500">{business.city}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {business.phone && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <Phone className="h-4 w-4 text-secondary shrink-0" />
                      <a
                        href={`tel:${business.phone}`}
                        className="text-secondary hover:underline font-medium text-sm"
                      >
                        {business.phone}
                      </a>
                    </div>
                  )}

                  {!business.address && !business.city && !business.phone && (
                    <p className="text-gray-500 text-sm p-2.5">
                      No contact information available.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Loyalty Program Card */}
              <Card className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-secondary rounded-2xl bg-white shadow-md border border-gray-100">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                <CardHeader className="relative pb-3">
                  <CardTitle className="flex items-center gap-3 text-base text-gray-900">
                    <div className="p-2 rounded-xl bg-linear-to-br from-primary to-secondary text-white">
                      <Star className="h-4 w-4" />
                    </div>
                    Loyalty Program
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Earn points with every purchase
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative pt-0">
                  {business.points_per_purchase || business.pesos_per_point ? (
                    <div className="space-y-3">
                      {business.points_per_purchase && (
                        <div className="p-3 rounded-xl bg-linear-to-r from-primary/10 to-secondary/10 border border-primary/20">
                          <p className="text-base text-gray-700">
                            Earn{' '}
                            <span className="font-bold text-lg bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                              {business.points_per_purchase} points
                            </span>{' '}
                            per purchase
                          </p>
                        </div>
                      )}
                      {business.pesos_per_point && (
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                          {business.pesos_per_point} peso(s) = 1 point
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm p-2.5">
                      Contact the business for loyalty program details.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
