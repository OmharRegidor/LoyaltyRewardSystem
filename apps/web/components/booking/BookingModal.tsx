// apps/web/components/booking/BookingModal.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  X,
  CheckCircle,
  Copy,
  Check,
  Download,
  CreditCard,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Gift,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import { BookingForm } from './BookingForm';
import { PriceSummary } from './PriceSummary';
import {
  useBookingForm,
  type BookingService,
  type BookingAddon,
  type PublicAvailability,
  type PriceVariant,
} from '@/hooks/useBookingForm';

// ============================================
// TYPES
// ============================================

type BusinessType = 'retail' | 'restaurant' | 'salon' | 'hotel';

interface AddonOption {
  id: string;
  name: string;
  price_centavos: number;
  description: string | null;
}

interface AddonWithOptions extends BookingAddon {
  options?: AddonOption[];
}

interface ServiceWithVariants extends BookingService {
  price_variants?: PriceVariant[];
  config?: Record<string, unknown> | null;
}

interface BookingResult {
  bookingId: string;
  confirmationCode: string;
  customerId: string;
  cardToken: string;
  pointsEarned: number;
  isNewCustomer: boolean;
  totalPriceCentavos: number;
}

interface BusinessInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  points_per_purchase: number | null;
  pesos_per_point: number | null;
  business_type?: BusinessType | null;
}

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: BusinessInfo;
  services: ServiceWithVariants[];
  addons: AddonWithOptions[];
  availability: PublicAvailability[];
  initialServiceId?: string | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPrice(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pesos);
}

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BookingModal({
  open,
  onOpenChange,
  business,
  services,
  addons,
  availability,
  initialServiceId,
}: BookingModalProps) {
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const businessType = business.business_type || null;

  // Get closed days of week
  const closedDaysOfWeek = availability
    .filter((a) => !a.is_available)
    .map((a) => a.day_of_week);

  // Get initial service config (first service or initialServiceId)
  const initialServiceConfig = useMemo(() => {
    const targetId =
      initialServiceId || (services.length > 0 ? services[0].id : null);
    if (!targetId) return null;
    const service = services.find((s) => s.id === targetId);
    return service?.config || null;
  }, [services, initialServiceId]);

  // Initialize the booking form hook
  const form = useBookingForm({
    services,
    addons,
    pointsPerPurchase: business.points_per_purchase,
    pesosPerPoint: business.pesos_per_point,
    initialServiceId,
    businessType,
    serviceConfig: initialServiceConfig,
  });

  // Get price variants for selected service
  const selectedServiceVariants = useMemo(() => {
    if (!form.state.selectedService) return [];
    const service = services.find(
      (s) => s.id === form.state.selectedService?.id,
    );
    return service?.price_variants || [];
  }, [form.state.selectedService, services]);

  // Get config for selected service
  const selectedServiceConfig = useMemo(() => {
    if (!form.state.selectedService) return null;
    const service = services.find(
      (s) => s.id === form.state.selectedService?.id,
    );
    return service?.config || null;
  }, [form.state.selectedService, services]);

  // Reset form and auto-select first service when modal opens
  useEffect(() => {
    if (open) {
      form.reset();
      setBookingResult(null);
      setCopied(false);
      // Auto-select the first service (each business has one default booking form)
      if (services.length > 0 && !form.state.selectedService) {
        form.selectService(services[0]);
      }
    }
  }, [open, services]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle booking confirmation
  const handleConfirm = useCallback(async () => {
    if (!form.isValid || !form.state.selectedService) return;

    form.setIsSubmitting(true);
    form.setError(null);

    try {
      const requestBody = {
        service_id: form.state.selectedService.id,
        booking_date: format(form.state.checkInDate!, 'yyyy-MM-dd'),
        start_time: form.state.selectedTime || undefined,
        end_date: form.state.checkOutDate
          ? format(form.state.checkOutDate, 'yyyy-MM-dd')
          : null,
        nights:
          form.priceBreakdown.nights > 1 ? form.priceBreakdown.nights : null,
        customer_name: form.state.contact.name || 'Guest',
        customer_phone: form.state.contact.phone,
        customer_email: form.state.contact.email || null,
        notes: form.state.specialRequests || null,
        // New fields
        variant_id: form.state.selectedVariant?.id || null,
        party_size: businessType === 'restaurant' ? form.state.partySize : null,
        guests_adults: businessType === 'hotel' ? form.state.adultsCount : null,
        guests_children:
          businessType === 'hotel' ? form.state.childrenCount : null,
        addons:
          form.state.selectedAddons.length > 0
            ? form.state.selectedAddons.map((a) => ({
                addon_id: a.id,
                quantity: a.quantity,
                option_id: a.selectedOption?.id || null,
                option_price_centavos: a.selectedOption?.priceCentavos || null,
              }))
            : null,
      };

      const res = await fetch(
        `/api/public/business/${business.slug}/bookings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      if (data.success && data.data) {
        setBookingResult(data.data);
      }
    } catch (err) {
      console.error('Booking error:', err);
      form.setError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    } finally {
      form.setIsSubmitting(false);
    }
  }, [form, business.slug, businessType]);

  // Handle copy confirmation code
  const handleCopyCode = async () => {
    if (!bookingResult) return;
    try {
      await navigator.clipboard.writeText(bookingResult.confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle calendar download
  const handleDownloadCalendar = () => {
    if (!bookingResult) return;
    window.open(
      `/api/public/booking/${bookingResult.confirmationCode}?format=ics`,
      '_blank',
    );
  };

  // Success state
  if (bookingResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-lg p-0 gap-0 overflow-hidden bg-white border border-gray-900"
          showCloseButton={false}
        >
          <div className="flex flex-col">
            {/* Success Header */}
            <div className="p-6 text-center border-b border-gray-900 bg-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <DialogTitle className="text-2xl font-bold mb-1 text-gray-900">
                Booking Confirmed!
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Your {businessType === 'hotel' ? 'reservation' : 'appointment'}{' '}
                has been scheduled
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-white">
              {/* Confirmation Code */}
              <Card className="border-gray-900 bg-yellow-50">
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">
                    Confirmation Code
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold tracking-wider text-gray-900">
                      {bookingResult.confirmationCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-900 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {form.state.selectedVariant?.name ||
                        form.state.selectedService?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {form.state.checkInDate &&
                        format(form.state.checkInDate, 'EEEE, MMMM d, yyyy')}
                      {form.state.checkOutDate && (
                        <>
                          {' '}
                          - {format(form.state.checkOutDate, 'MMMM d, yyyy')}
                        </>
                      )}
                    </p>
                    {form.state.selectedTime && (
                      <Badge variant="outline" className="mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeForDisplay(form.state.selectedTime)}
                      </Badge>
                    )}
                  </div>
                </div>

                {business.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <p className="text-sm text-gray-900">{business.address}</p>
                  </div>
                )}

                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <a
                      href={`tel:${business.phone}`}
                      className="text-sm text-gray-900 hover:underline"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              {/* Total & Points */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold text-lg text-gray-900">
                  {formatPrice(bookingResult.totalPriceCentavos)}
                </span>
              </div>

              {bookingResult.pointsEarned > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-gray-900">
                  <Gift className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      +{bookingResult.pointsEarned} point
                      {bookingResult.pointsEarned !== 1 ? 's' : ''} earned!
                    </p>
                    <p className="text-xs text-gray-600">
                      {bookingResult.isNewCustomer
                        ? 'Welcome! Your loyalty card has been created.'
                        : 'Points added to your loyalty card.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadCalendar}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>

                {bookingResult.cardToken && (
                  <Button
                    asChild
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 border border-gray-900"
                  >
                    <Link href={`/card/${bookingResult.cardToken}`}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      View Your Loyalty Card
                    </Link>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Booking form state
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-1rem)] h-[calc(100vh-1rem)] max-w-none sm:w-[calc(100vw-2rem)] sm:h-[calc(100vh-2rem)] lg:max-w-6xl p-0 gap-0 overflow-hidden flex flex-col bg-white border border-gray-900"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-primary bg-gray-900">
          <div>
            <DialogTitle className="text-xl font-bold text-white">
              {businessType === 'hotel'
                ? 'Book Your Stay'
                : businessType === 'restaurant'
                  ? 'Make a Reservation'
                  : 'Book Your Appointment'}
            </DialogTitle>
            <p className="text-sm text-gray-300">at {business.name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 text-white hover:text-gray-300 hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column - Form */}
          <ScrollArea className="flex-1 lg:border-r lg:border-gray-200 bg-white">
            <div className="p-6 bg-white">
              <BookingForm
                businessType={businessType}
                serviceConfig={selectedServiceConfig}
                serviceId={form.state.selectedService?.id || null}
                variants={selectedServiceVariants}
                selectedVariant={form.state.selectedVariant}
                onVariantSelect={form.selectVariant}
                checkInDate={form.state.checkInDate}
                checkOutDate={form.state.checkOutDate}
                selectedTime={form.state.selectedTime}
                onCheckInChange={form.setCheckInDate}
                onCheckOutChange={form.setCheckOutDate}
                onTimeChange={form.setSelectedTime}
                adultsCount={form.state.adultsCount}
                childrenCount={form.state.childrenCount}
                maxGuests={form.maxGuests}
                onAdultsChange={form.setAdultsCount}
                onChildrenChange={form.setChildrenCount}
                onIncrementAdults={form.incrementAdults}
                onDecrementAdults={form.decrementAdults}
                onIncrementChildren={form.incrementChildren}
                onDecrementChildren={form.decrementChildren}
                partySize={form.state.partySize}
                onPartySizeChange={form.setPartySize}
                addons={addons}
                selectedAddons={form.state.selectedAddons}
                onAddonToggle={form.toggleAddon}
                onAddonQuantityChange={form.setAddonQuantity}
                onAddonOptionChange={form.setAddonOption}
                phone={form.state.contact.phone}
                name={form.state.contact.name}
                email={form.state.contact.email}
                specialRequests={form.state.specialRequests}
                onPhoneChange={form.setPhone}
                onNameChange={form.setName}
                onEmailChange={form.setEmail}
                onSpecialRequestsChange={form.setSpecialRequests}
                businessSlug={business.slug}
                closedDaysOfWeek={closedDaysOfWeek}
              />

              {/* Error message */}
              {form.state.error && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-300 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{form.state.error}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Right Column - Price Summary */}
          <div className="lg:w-[400px] hidden lg:flex flex-col bg-gray-50 shrink-0">
            <div className="flex-1 p-6 overflow-auto">
              <PriceSummary
                businessType={businessType}
                serviceName={form.state.selectedService?.name || null}
                selectedVariant={form.state.selectedVariant}
                checkInDate={form.state.checkInDate}
                checkOutDate={form.state.checkOutDate}
                selectedTime={form.state.selectedTime}
                nights={form.priceBreakdown.nights}
                adultsCount={form.state.adultsCount}
                childrenCount={form.state.childrenCount}
                partySize={form.state.partySize}
                serviceSubtotal={form.priceBreakdown.serviceSubtotal}
                selectedAddons={form.state.selectedAddons}
                addonsTotal={form.priceBreakdown.addonsTotal}
                total={form.priceBreakdown.total}
                pointsEstimate={form.priceBreakdown.pointsEstimate}
                isMultiDay={form.isMultiDay}
                isValid={form.isValid}
                isSubmitting={form.state.isSubmitting}
                onConfirm={handleConfirm}
                businessPhone={business.phone}
              />
            </div>
          </div>
        </div>

        {/* Mobile footer with summary */}
        <div className="lg:hidden border-t border-gray-900 p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="font-bold text-lg text-gray-900">
                {formatPrice(form.priceBreakdown.total)}
              </p>
            </div>
            {form.priceBreakdown.pointsEstimate > 0 && (
              <Badge variant="secondary" className="gap-1 bg-yellow-100 text-gray-900 border border-gray-300">
                <Gift className="h-3 w-3" />+
                {form.priceBreakdown.pointsEstimate} pts
              </Badge>
            )}
          </div>
          <Button
            onClick={handleConfirm}
            disabled={!form.isValid || form.state.isSubmitting}
            className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-gray-900 border border-gray-900 font-semibold"
          >
            {form.state.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export types for use in pages
export type {
  BookingService,
  BookingAddon,
  BusinessInfo,
  AddonWithOptions,
  ServiceWithVariants,
};
