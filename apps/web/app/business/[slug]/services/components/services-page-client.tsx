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
import { Separator } from '@/components/ui/separator';
import { Clock, Phone, Sparkles, Calendar, ArrowRight, Package } from 'lucide-react';
import type {
  PublicBusiness,
  PublicService,
  PublicAvailability,
  PublicAddon,
  PublicPriceVariant,
} from '@/lib/services/public-business.service';
import type { BusinessType } from '@/types/booking.types';
import { BookingModal } from '@/components/booking';

// ============================================
// TYPES
// ============================================

interface ServicesPageClientProps {
  business: PublicBusiness;
  services: PublicService[];
  availability: PublicAvailability[];
  addons?: PublicAddon[];
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
  if (minutes >= 1440) {
    const days = minutes / 1440;
    if (days === 1) return '1 night';
    return `${days} nights`;
  }
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

// Group addons by category
function groupAddonsByCategory(addons: PublicAddon[]): Map<string, PublicAddon[]> {
  const grouped = new Map<string, PublicAddon[]>();
  for (const addon of addons) {
    const category = addon.category || 'Other';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(addon);
  }
  return grouped;
}

// Extract max guests from service config
function getMaxGuestsFromConfig(service: PublicService): number {
  if (!service.config) return 1;
  const config = service.config as Record<string, unknown>;
  // Hotel config has capacity_max
  if (typeof config.capacity_max === 'number') {
    return config.capacity_max;
  }
  // Restaurant config has party_size_max
  if (typeof config.party_size_max === 'number') {
    return config.party_size_max;
  }
  return 1;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ServicesPageClient({
  business,
  services,
  availability,
  addons = [],
}: ServicesPageClientProps) {
  const [mounted, setMounted] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBookNow = (service: PublicService) => {
    setSelectedService(service);
    setBookingOpen(true);
  };

  if (!mounted) {
    return null;
  }

  const groupedAddons = groupAddonsByCategory(addons);

  return (
    <>
      <div className="relative min-h-screen" style={{ backgroundColor: '#ffffff' }}>
        {/* Subtle Background Decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/10 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-muted/50 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">What We Offer</h1>
                <p className="text-gray-500 text-base sm:text-lg">
                  Browse our services and book your appointment
                </p>
              </div>
            </div>
          </motion.div>

          {/* Services Section */}
          {services.length > 0 && (
            <div className="mb-12">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="mb-6"
              >
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                  <Calendar className="h-5 w-5 text-primary" />
                  Services
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Select a service to book your appointment
                </p>
              </motion.div>

              <motion.div
                className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                initial="hidden"
                animate="visible"
                variants={staggerContainerVariants}
              >
                {services.map((service) => (
                  <motion.div key={service.id} variants={cardVariants}>
                    <Card className="flex flex-col h-full overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-primary border border-gray-100 shadow-md bg-white">
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
                            className="gap-1.5 bg-muted/50 border border-gray-100 shadow-md"
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
                          onClick={() => handleBookNow(service)}
                        >
                          Book Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Add-ons Section */}
          {addons.length > 0 && (
            <div className="mb-12">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="mb-6"
              >
                <Separator className="mb-8" />
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                  <Package className="h-5 w-5 text-primary" />
                  Add-ons & Extras
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enhance your booking with these optional extras
                </p>
              </motion.div>

              {Array.from(groupedAddons.entries()).map(([category, categoryAddons]) => (
                <div key={category} className="mb-8">
                  {groupedAddons.size > 1 && (
                    <h3 className="text-sm font-medium text-gray-500 mb-3 capitalize">
                      {category}
                    </h3>
                  )}
                  <motion.div
                    className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainerVariants}
                  >
                    {categoryAddons.map((addon) => (
                      <motion.div key={addon.id} variants={cardVariants}>
                        <Card className="h-full border border-gray-100 shadow-md hover:border-primary/30 transition-colors bg-white">
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{addon.name}</p>
                                {addon.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                    {addon.description}
                                  </p>
                                )}
                                {addon.duration_minutes && (
                                  <Badge variant="outline" className="gap-1 text-xs mt-2">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(addon.duration_minutes)}
                                  </Badge>
                                )}
                              </div>
                              <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
                                {formatPrice(addon.price_centavos)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ))}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-gray-500 text-center mt-4"
              >
                Add-ons can be selected during the booking process
              </motion.p>
            </div>
          )}

          {/* No Services State */}
          {services.length === 0 && addons.length === 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <Card className="text-center py-12 border border-gray-100 shadow-md">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
                    <Sparkles className="h-10 w-10 text-primary/60" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    No Services Available
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
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
              <Card className="mt-10 overflow-hidden border-t-4 border-t-primary border border-gray-100 shadow-md group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl bg-white">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none" />
                <CardContent className="py-6 relative">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className="font-semibold text-lg text-gray-900">
                          Need help booking?
                        </h3>
                        <p className="text-gray-500">
                          Contact us directly for assistance with your appointment
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="rounded-xl px-4 sm:px-6 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold"
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
          business_type: business.business_type as BusinessType | null,
        }}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price_centavos: s.price_centavos,
          duration_minutes: s.duration_minutes,
          max_guests: getMaxGuestsFromConfig(s),
          requires_time_slot: s.duration_minutes < 1440,
          price_type: s.pricing_type === 'per_night' ? 'per_night' : s.duration_minutes >= 1440 ? 'per_night' : 'per_session',
          price_variants: (s.price_variants || []).map((v: PublicPriceVariant) => ({
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
          options: (a.options || []).map((o) => ({
            id: o.id,
            name: o.name,
            price_centavos: o.price_centavos,
            description: o.description,
          })),
        }))}
        availability={availability}
        initialServiceId={selectedService?.id}
      />
    </>
  );
}
