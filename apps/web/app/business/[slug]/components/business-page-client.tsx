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

              {/* Action Buttons - Yellow CTA, Maroon Outline */}
              <div className="flex flex-wrap gap-3 mt-2">
                {business.business_type !== 'retail' && (
                  <Button
                    size="lg"
                    className="bg-secondary text-secondary-foreground rounded-xl px-4 sm:px-8 h-10 sm:h-12 shadow-lg hover:shadow-xl hover:scale-105 hover:bg-secondary/90 transition-all font-bold"
                    onClick={() => setBookingOpen(true)}
                    disabled={services.length === 0}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
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

          {/* Business Hours Card - Full width at bottom */}
          <motion.div className="mt-6" variants={cardVariants}>
            <Card className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 border-t-primary rounded-2xl bg-white shadow-md border border-gray-100">
              <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
              <CardHeader className="relative pb-2 sm:pb-6 px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg text-gray-900">
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
                        (a) => a.day_of_week === index,
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
                              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                            <span
                              className={`font-semibold text-xs sm:text-base truncate ${isToday ? 'text-primary' : 'text-gray-900'}`}
                            >
                              <span className="sm:hidden">{shortDayName}</span>
                              <span className="hidden sm:inline">
                                {dayName}
                              </span>
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
                            <span className="text-[10px] sm:text-sm text-gray-600">
                              {formatTime(dayAvailability.start_time)} -{' '}
                              {formatTime(dayAvailability.end_time)}
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
                  <p className="text-gray-500 text-sm p-3">
                    Business hours not available. Please contact the business
                    for their schedule.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Booking Modal - New Full-Screen Design */}
      {business.business_type !== 'retail' && <BookingModal
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
          business_type: business.business_type as
            | 'retail'
            | 'restaurant'
            | 'salon'
            | 'hotel'
            | null,
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
          config: s.config,
          price_variants: s.price_variants?.map((v) => ({
            id: v.id,
            name: v.name,
            price_centavos: v.price_centavos,
            description: v.description,
            capacity: v.capacity,
          })),
        }))}
        addons={addons.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          price_centavos: a.price_centavos,
          price_type: 'fixed' as const,
          service_id: null,
          category: a.category,
          options: a.options?.map((o) => ({
            id: o.id,
            name: o.name,
            price_centavos: o.price_centavos,
            description: o.description,
          })),
        }))}
        availability={availability}
      />}
    </div>
  );
}
