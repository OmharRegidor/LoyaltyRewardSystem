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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  Phone,
  Calendar,
  Gift,
  Star,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type {
  PublicBusiness,
  PublicAvailability,
  PublicService,
  PublicAddon,
} from '@/lib/services/public-business.service';
import { BookingModal } from '@/components/booking';

// ============================================
// TYPES
// ============================================

interface BusinessPageClientProps {
  business: PublicBusiness;
  availability: PublicAvailability[];
  services: PublicService[];
  addons: PublicAddon[];
  slug: string;
}

// ============================================
// CONSTANTS
// ============================================

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

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

const dayItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getTodayIndex(): number {
  return new Date().getDay();
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BusinessPageClient({
  business,
  availability,
  services,
  addons,
  slug,
}: BusinessPageClientProps) {
  const [mounted, setMounted] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const todayIndex = getTodayIndex();

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
        {/* Hero Section */}
        <motion.div
          className="mb-12"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
            {/* Logo with glow effect */}
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-linear-to-r from-primary/30 to-secondary/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-110" />

              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={120}
                  height={120}
                  className="rounded-2xl object-cover relative z-10 shadow-lg"
                />
              ) : (
                <div className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-secondary/20 relative z-10 shadow-lg">
                  <Building2 className="h-14 w-14 text-primary" />
                </div>
              )}
            </motion.div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                  {business.name}
                </h1>
                {business.business_type && (
                  <Badge className="bg-linear-to-r from-primary/10 to-secondary/10 text-primary border-primary/20 hover:from-primary/20 hover:to-secondary/20 transition-colors text-sm px-3 py-1">
                    {business.business_type}
                  </Badge>
                )}
              </div>
              {business.description && (
                <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
                  {business.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <motion.div
            className="flex flex-wrap gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              className="bg-linear-to-r from-primary to-secondary text-primary-foreground rounded-xl px-4 sm:px-8 h-10 sm:h-12 shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold"
              onClick={() => setBookingOpen(true)}
              disabled={services.length === 0}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book a Service
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              asChild
              size="lg"
              className="rounded-xl px-4 sm:px-8 h-10 sm:h-12 border-2 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
            >
              <Link href={`/business/${slug}/rewards`}>
                <Gift className="mr-2 h-5 w-5" />
                View Rewards
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainerVariants}
        >
          {/* Contact Information Card */}
          <motion.div variants={cardVariants}>
            <Card className="h-full overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50">
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-primary to-secondary text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                {(business.address || business.city) && (
                  <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      {business.address && (
                        <p className="font-medium">{business.address}</p>
                      )}
                      {business.city && (
                        <p className="text-muted-foreground">{business.city}</p>
                      )}
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <Phone className="h-5 w-5 text-primary shrink-0" />
                    <a
                      href={`tel:${business.phone}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}

                {!business.address && !business.city && !business.phone && (
                  <p className="text-muted-foreground text-sm p-3">
                    No contact information available.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Loyalty Program Card */}
          <motion.div variants={cardVariants}>
            <Card className="h-full overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50">
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-primary to-secondary text-white">
                    <Star className="h-5 w-5" />
                  </div>
                  Loyalty Program
                </CardTitle>
                <CardDescription className="text-base">
                  Earn points with every purchase
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                {business.points_per_purchase || business.pesos_per_point ? (
                  <div className="space-y-4">
                    {business.points_per_purchase && (
                      <div className="p-4 rounded-xl bg-linear-to-r from-primary/10 to-secondary/10 border border-primary/20">
                        <p className="text-xl">
                          Earn{' '}
                          <span className="font-bold text-2xl bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {business.points_per_purchase} points
                          </span>{' '}
                          per purchase
                        </p>
                      </div>
                    )}
                    {business.pesos_per_point && (
                      <p className="text-muted-foreground flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                        {business.pesos_per_point} peso(s) = 1 point
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm p-3">
                    Contact the business for loyalty program details.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Business Hours Card */}
        <motion.div
          className="max-w-4xl mx-auto mt-6"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50">
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
            <CardHeader className="relative pb-2 sm:pb-6 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                <div className="p-2 sm:p-2.5 rounded-xl bg-linear-to-br from-primary to-secondary text-white">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-0 px-3 sm:px-6">
              {availability.length > 0 ? (
                <motion.div
                  className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainerVariants}
                >
                  {DAY_NAMES.map((dayName, index) => {
                    const dayAvailability = availability.find(
                      (a) => a.day_of_week === index
                    );
                    const isToday = index === todayIndex;
                    const isOpen =
                      dayAvailability && dayAvailability.is_available;
                    // Abbreviated day name for mobile
                    const shortDayName = dayName.slice(0, 3);

                    return (
                      <motion.div
                        key={index}
                        variants={dayItemVariants}
                        className={`relative flex flex-col p-2 sm:p-4 rounded-lg sm:rounded-xl transition-all min-w-0 ${
                          isToday
                            ? 'bg-linear-to-br from-primary/10 to-secondary/10 border-2 border-primary/30 shadow-md'
                            : 'bg-muted/50 hover:bg-muted border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                          <span
                            className={`font-semibold text-xs sm:text-base truncate ${isToday ? 'text-primary' : ''}`}
                          >
                            <span className="sm:hidden">{shortDayName}</span>
                            <span className="hidden sm:inline">{dayName}</span>
                          </span>
                          {isToday && (
                            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-primary shrink-0">
                              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-primary" />
                              </span>
                              <span className="hidden sm:inline">Today</span>
                            </span>
                          )}
                        </div>
                        {isOpen ? (
                          <span className="text-[10px] sm:text-sm text-muted-foreground">
                            {formatTime(dayAvailability.start_time)} - {formatTime(dayAvailability.end_time)}
                          </span>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="w-fit text-[10px] sm:text-xs px-1.5 sm:px-2.5"
                          >
                            Closed
                          </Badge>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <p className="text-muted-foreground text-sm p-3">
                  Business hours not available. Please contact the business
                  for their schedule.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Booking Modal - New Full-Screen Design */}
      <BookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        business={{
          id: business.id,
          name: business.name,
          slug: business.slug,
          logo_url: business.logo_url,
          phone: business.phone,
          address: business.address,
          points_per_purchase: business.points_per_purchase,
          pesos_per_point: business.pesos_per_point,
        }}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price_centavos: s.price_centavos,
          duration_minutes: s.duration_minutes,
          max_guests: 1,
          requires_time_slot: s.duration_minutes < 1440,
          price_type: s.duration_minutes >= 1440 ? 'per_night' : 'per_session',
        }))}
        addons={addons.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          price_centavos: a.price_centavos,
          price_type: 'fixed' as const,
          service_id: null,
        }))}
        availability={availability}
      />
    </div>
  );
}
