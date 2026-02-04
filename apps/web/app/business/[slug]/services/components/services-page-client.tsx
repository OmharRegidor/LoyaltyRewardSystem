// apps/web/app/business/[slug]/services/components/services-page-client.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Phone, Sparkles, Calendar } from 'lucide-react';
import type {
  PublicBusiness,
  PublicService,
} from '@/lib/services/public-business.service';

// ============================================
// TYPES
// ============================================

interface ServicesPageClientProps {
  business: PublicBusiness;
  services: PublicService[];
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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
// HELPER FUNCTIONS
// ============================================

function formatPrice(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(pesos);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr ${remainingMins} min`;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ServicesPageClient({
  business,
  services,
}: ServicesPageClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 dark:bg-primary/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob" />
        <div className="absolute top-40 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/10 dark:bg-secondary/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 dark:bg-primary/3 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          className="mb-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
              <Calendar className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Our Services</h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Browse our available services and book your appointment
              </p>
            </div>
          </div>
        </motion.div>

        {/* Services Grid */}
        {services.length > 0 ? (
          <motion.div
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
          >
            {services.map((service) => (
              <motion.div key={service.id} variants={cardVariants}>
                <Card className="flex flex-col h-full overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />

                  <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    {service.description && (
                      <CardDescription className="line-clamp-2">
                        {service.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-end relative">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge
                        variant="outline"
                        className="gap-1.5 bg-muted/50 border-border/50"
                      >
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {formatDuration(service.duration_minutes)}
                      </Badge>
                      {service.price_centavos && (
                        <Badge className="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20 hover:from-primary/20 hover:to-secondary/20">
                          {formatPrice(service.price_centavos)}
                        </Badge>
                      )}
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-lg hover:scale-[1.02] transition-all"
                      disabled
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Card className="text-center py-12 border-border/50">
              <CardContent>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
                  <Sparkles className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No Services Available
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  This business hasn&apos;t added any services yet. Check back
                  later or contact them directly.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contact CTA */}
        {business.phone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mt-10 overflow-hidden border-primary/20 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none" />
              <CardContent className="py-6 relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-lg">
                        Need help booking?
                      </h3>
                      <p className="text-muted-foreground">
                        Contact us directly for assistance with your appointment
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="rounded-xl px-4 sm:px-6 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all font-semibold"
                  >
                    <a href={`tel:${business.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {business.phone}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
