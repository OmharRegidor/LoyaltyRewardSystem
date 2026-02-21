// apps/web/app/business/[slug]/my-bookings/my-bookings-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CalendarDays,
  Phone,
  Search,
  Loader2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
} from 'lucide-react';
import type { PublicBusiness } from '@/lib/services/public-business.service';

// ============================================
// TYPES
// ============================================

interface CustomerBooking {
  id: string;
  confirmationCode: string;
  bookingDate: string;
  startTime: string;
  status: string;
  nights: number | null;
  totalPriceCentavos: number | null;
  service: {
    name: string;
    durationMinutes: number;
    priceCentavos: number | null;
  };
  addonsCount: number;
}

interface MyBookingsClientProps {
  business: PublicBusiness;
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
// VALIDATION SCHEMA
// ============================================

const PhoneLookupSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .regex(/^[0-9]+$/, 'Phone number must contain only digits'),
});

type PhoneLookupFormData = z.infer<typeof PhoneLookupSchema>;

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

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getStatusBadge(status: string, bookingDate: string) {
  const date = parseISO(bookingDate);
  const past = isPast(date) && !isToday(date);

  if (status === 'cancelled') {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Cancelled
      </Badge>
    );
  }

  if (status === 'completed' || past) {
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
        <CheckCircle className="h-3 w-3" />
        Completed
      </Badge>
    );
  }

  if (isToday(date)) {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
        <Clock className="h-3 w-3" />
        Today
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Calendar className="h-3 w-3" />
      Upcoming
    </Badge>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MyBookingsClient({ business }: MyBookingsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<CustomerBooking[] | null>(null);
  const [searchedPhone, setSearchedPhone] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneLookupFormData>({
    resolver: zodResolver(PhoneLookupSchema),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = async (data: PhoneLookupFormData) => {
    setLoading(true);
    setError(null);
    setBookings(null);

    try {
      const res = await fetch(
        `/api/public/business/${business.slug}/my-bookings?phone=${data.phone}`
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch bookings');
      }

      setBookings(result.data);
      setSearchedPhone(data.phone);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  // Separate upcoming and past bookings
  const upcomingBookings = bookings?.filter((b) => {
    const date = parseISO(b.bookingDate);
    return !isPast(date) || isToday(date);
  });
  const pastBookings = bookings?.filter((b) => {
    const date = parseISO(b.bookingDate);
    return isPast(date) && !isToday(date);
  });

  return (
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
            <div className="p-2.5 sm:p-3 rounded-2xl bg-linear-to-br from-primary to-secondary text-white shadow-lg">
              <CalendarDays className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-500 text-base sm:text-lg">
                View your booking history at {business.name}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Phone Lookup Form */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Card className="mb-8 border-l-4 border-l-primary rounded-2xl bg-white shadow-md border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Search className="h-5 w-5 text-primary" />
                Find Your Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Phone Number
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="09171234567"
                      {...register('phone')}
                      onKeyDown={(e) => {
                        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
                        if (!/^\d$/.test(e.key)) e.preventDefault();
                      }}
                      className={`flex-1 rounded-xl ${errors.phone ? 'border-destructive' : ''}`}
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-linear-to-r from-primary to-secondary text-primary-foreground rounded-xl"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Enter the phone number you used when making your booking
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-destructive/50 bg-destructive/5 mb-8 rounded-2xl">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {bookings !== null && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
          >
            {bookings.length === 0 ? (
              <motion.div variants={cardVariants}>
                <Card className="text-center py-12 border-border/50 rounded-2xl">
                  <CardContent>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-secondary/10 mb-4">
                      <CalendarDays className="h-10 w-10 text-primary/60" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      No Bookings Found
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      We couldn&apos;t find any bookings for {searchedPhone}. Make sure
                      you entered the correct phone number.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <>
                {/* Upcoming Bookings */}
                {upcomingBookings && upcomingBookings.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                      <Calendar className="h-5 w-5 text-primary" />
                      Upcoming Bookings
                    </h2>
                    <div className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <motion.div key={booking.id} variants={cardVariants}>
                          <Card className="border-l-4 border-l-secondary border-border/50 hover:shadow-lg transition-shadow rounded-2xl bg-white">
                            <CardContent className="py-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">
                                      {booking.service.name}
                                    </h3>
                                    {getStatusBadge(booking.status, booking.bookingDate)}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <CalendarDays className="h-4 w-4" />
                                      {format(parseISO(booking.bookingDate), 'EEEE, MMMM d, yyyy')}
                                    </span>
                                    {booking.startTime && booking.startTime !== '00:00' && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {formatTimeForDisplay(booking.startTime)}
                                      </span>
                                    )}
                                    {booking.nights && booking.nights > 1 && (
                                      <span className="flex items-center gap-1">
                                        {booking.nights} nights
                                      </span>
                                    )}
                                  </div>
                                  {booking.addonsCount > 0 && (
                                    <div className="mt-2">
                                      <Badge variant="outline" className="gap-1 text-xs">
                                        <Package className="h-3 w-3" />
                                        {booking.addonsCount} add-on{booking.addonsCount !== 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 mb-1">
                                    Confirmation
                                  </p>
                                  <p className="font-mono font-bold text-primary">
                                    {booking.confirmationCode}
                                  </p>
                                  {booking.totalPriceCentavos && (
                                    <p className="text-sm font-medium mt-1">
                                      {formatPrice(booking.totalPriceCentavos)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Bookings */}
                {pastBookings && pastBookings.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
                      <Clock className="h-5 w-5 text-gray-500" />
                      Past Bookings
                    </h2>
                    <div className="space-y-4">
                      {pastBookings.map((booking) => (
                        <motion.div key={booking.id} variants={cardVariants}>
                          <Card className="border-border/50 opacity-75 rounded-2xl bg-white">
                            <CardContent className="py-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">
                                      {booking.service.name}
                                    </h3>
                                    {getStatusBadge(booking.status, booking.bookingDate)}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <CalendarDays className="h-4 w-4" />
                                      {format(parseISO(booking.bookingDate), 'MMMM d, yyyy')}
                                    </span>
                                    {booking.startTime && booking.startTime !== '00:00' && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {formatTimeForDisplay(booking.startTime)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono text-sm text-gray-500">
                                    {booking.confirmationCode}
                                  </p>
                                  {booking.totalPriceCentavos && (
                                    <p className="text-sm">
                                      {formatPrice(booking.totalPriceCentavos)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
