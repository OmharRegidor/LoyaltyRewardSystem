// apps/web/app/business/[slug]/services/components/booking-modal.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { startOfDay } from 'date-fns';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft,
  Calendar,
  CalendarDays,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Loader2,
  AlertCircle,
  Gift,
  CheckCircle,
  Download,
  CreditCard,
  MapPin,
  Copy,
  Check,
  Info,
  Moon,
  Plus,
  Minus,
  Package,
} from 'lucide-react';
import type {
  PublicBusiness,
  PublicService,
  PublicAvailability,
  PublicAddon,
} from '@/lib/services/public-business.service';

import 'react-day-picker/style.css';

// ============================================
// TYPES
// ============================================

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: PublicBusiness;
  service: PublicService | null;
  services?: PublicService[];
  availability: PublicAvailability[];
  addons?: PublicAddon[];
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  notes: string;
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

interface SelectedAddon {
  id: string;
  name: string;
  priceCentavos: number;
  quantity: number;
}

type Step = 'service' | 'options' | 'date' | 'time' | 'info' | 'confirm' | 'success';

// ============================================
// VALIDATION SCHEMA
// ============================================

const CustomerInfoSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .regex(/^[0-9]+$/, 'Phone number must contain only digits'),
  email: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

type CustomerInfoFormData = z.infer<typeof CustomerInfoSchema>;

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

function getServiceType(
  durationMinutes: number
): 'time-based' | 'full-day' | 'multi-day' {
  if (durationMinutes >= 2880) return 'multi-day';
  if (durationMinutes >= 1440) return 'full-day';
  return 'time-based';
}

function calculateEstimatedPoints(
  totalCentavos: number,
  pointsPerPurchase: number | null,
  pesosPerPoint: number | null
): number {
  if (!totalCentavos) return 0;
  const priceInPesos = totalCentavos / 100;
  const perPoint = pesosPerPoint || 100;
  const perPurchase = pointsPerPurchase || 1;
  return Math.floor(priceInPesos / perPoint) * perPurchase;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function BookingModal({
  open,
  onOpenChange,
  business,
  service,
  services,
  availability,
  addons = [],
}: BookingModalProps) {
  // Internal service state for when no service is pre-selected
  const [internalService, setInternalService] = useState<PublicService | null>(service);
  const hasServiceStep = !service && services && services.length > 0;
  const [step, setStep] = useState<Step>(hasServiceStep ? 'service' : 'options');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [booking, setBooking] = useState<BookingResult | null>(null);

  // Options step state
  const [nights, setNights] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);

  // Range state for multi-day services
  const [rangeValue, setRangeValue] = useState<DateRange | undefined>(undefined);
  const [rangeAvailability, setRangeAvailability] = useState<{
    available: boolean;
    nights: number;
    totalPrice: number;
  } | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);

  // Time slots state
  const [timeLoading, setTimeLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [businessHours, setBusinessHours] = useState<{
    open: string;
    close: string;
  } | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Confirm state
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Copy state for success step
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens or service changes
  useEffect(() => {
    if (open) {
      const startWithServiceStep = !service && services && services.length > 0;
      setStep(startWithServiceStep ? 'service' : 'options');
      setInternalService(service);
      setSelectedDate(null);
      setSelectedEndDate(null);
      setSelectedTime(null);
      setCustomerInfo({ name: '', phone: '', email: '', notes: '' });
      setBooking(null);
      setRangeValue(undefined);
      setRangeAvailability(null);
      setTimeSlots([]);
      setTimeError(null);
      setConfirmError(null);
      setNights(1);
      setSelectedAddons([]);
    }
  }, [open, service, services]);

  // Fetch time slots when date is selected
  useEffect(() => {
    if (!internalService || !selectedDate || getServiceType(internalService.duration_minutes) !== 'time-based') {
      return;
    }

    const fetchSlots = async () => {
      setTimeLoading(true);
      setTimeError(null);

      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await fetch(
          `/api/public/business/${business.slug}/availability?date=${dateStr}&service_id=${internalService.id}`
        );

        if (!res.ok) {
          throw new Error('Failed to fetch available times');
        }

        const data = await res.json();

        if (data.success && data.data) {
          setTimeSlots(data.data.slots || []);
          setBusinessHours(data.data.businessHours);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setTimeError('Unable to load available times. Please try again.');
      } finally {
        setTimeLoading(false);
      }
    };

    fetchSlots();
  }, [internalService, selectedDate, business.slug]);

  // Check range availability for multi-day services
  useEffect(() => {
    if (!internalService || getServiceType(internalService.duration_minutes) !== 'multi-day' || !rangeValue?.from || !rangeValue?.to) {
      setRangeAvailability(null);
      return;
    }

    const checkAvailability = async () => {
      setRangeLoading(true);
      try {
        const startDate = format(rangeValue.from!, 'yyyy-MM-dd');
        const endDate = format(rangeValue.to!, 'yyyy-MM-dd');

        const res = await fetch(
          `/api/public/business/${business.slug}/availability/range?start_date=${startDate}&end_date=${endDate}&service_id=${internalService.id}`
        );

        if (res.ok) {
          const data = await res.json();
          setRangeAvailability(data.data);
          // Sync nights with the range
          if (data.data?.nights) {
            setNights(data.data.nights);
          }
        }
      } catch (error) {
        console.error('Error checking availability:', error);
      } finally {
        setRangeLoading(false);
      }
    };

    checkAvailability();
  }, [internalService, rangeValue, business.slug]);

  // Derive service type from internalService (may be null if on service step)
  const serviceType = internalService ? getServiceType(internalService.duration_minutes) : null;
  const isMultiDay = serviceType === 'multi-day';
  const isFullDay = serviceType === 'full-day';
  const isTimeBased = serviceType === 'time-based';

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!internalService) return 0;
    const servicePrice = (internalService.price_centavos || 0) * nights;
    const addonsPrice = selectedAddons.reduce(
      (sum, addon) => sum + addon.priceCentavos * addon.quantity,
      0
    );
    return servicePrice + addonsPrice;
  }, [internalService, nights, selectedAddons]);

  // Get closed days of week from availability
  const closedDaysOfWeek = availability
    .filter((a) => !a.is_available)
    .map((a) => a.day_of_week);

  const disabledDays = [
    { before: startOfDay(new Date()) },
    (date: Date) => closedDaysOfWeek.includes(date.getDay()),
  ];

  // Determine if options step should be shown
  const hasOptionsStep = addons.length > 0 || isMultiDay || isFullDay;

  // Step management
  const getSteps = (): Step[] => {
    const baseSteps: Step[] = hasServiceStep ? ['service'] : [];

    // Add options step if we have addons or it's a multi-day/full-day service
    if (hasOptionsStep) {
      baseSteps.push('options');
    }

    if (isTimeBased) {
      return [...baseSteps, 'date', 'time', 'info', 'confirm', 'success'];
    }
    return [...baseSteps, 'date', 'info', 'confirm', 'success'];
  };

  const getMaxSteps = (): number => {
    // Max steps: service (if applicable) + options + date + time + info + confirm = 5 or 6
    let count = hasServiceStep ? 1 : 0;
    count += hasOptionsStep ? 1 : 0;
    count += 4; // date + info + confirm + success (we don't count success in progress)
    if (isTimeBased) count += 1; // time step
    return count - 1; // subtract success from progress
  };

  const steps = getSteps();
  const currentStepIndex = steps.indexOf(step);
  const maxSteps = getMaxSteps();
  const progressPercent = step === 'success' ? 100 : ((currentStepIndex + 1) / maxSteps) * 100;

  // Helper to check if we can go back
  const getFirstStep = () => hasServiceStep ? 'service' : (hasOptionsStep ? 'options' : 'date');
  const canGoBack = step !== getFirstStep() && step !== 'success';

  const handleBack = () => {
    if (step === 'success') return;
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleServiceContinue = () => {
    if (internalService) {
      setStep(hasOptionsStep ? 'options' : 'date');
    }
  };

  const handleOptionsContinue = () => {
    setStep('date');
  };

  const handleDateContinue = () => {
    if (isMultiDay) {
      if (rangeValue?.from && rangeValue?.to && rangeAvailability?.available) {
        setSelectedDate(rangeValue.from);
        setSelectedEndDate(rangeValue.to);
        setStep('info');
      }
    } else if (selectedDate) {
      if (isTimeBased) {
        setStep('time');
      } else {
        setStep('info');
      }
    }
  };

  const handleTimeContinue = (time: string) => {
    setSelectedTime(time);
    setStep('info');
  };

  const handleInfoContinue = (info: CustomerInfo) => {
    setCustomerInfo(info);
    setStep('confirm');
  };

  const handleAddonToggle = (addon: PublicAddon) => {
    setSelectedAddons((prev) => {
      const existing = prev.find((a) => a.id === addon.id);
      if (existing) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [
        ...prev,
        {
          id: addon.id,
          name: addon.name,
          priceCentavos: addon.price_centavos,
          quantity: 1,
        },
      ];
    });
  };

  const handleAddonQuantity = (addonId: string, delta: number) => {
    setSelectedAddons((prev) =>
      prev.map((a) => {
        if (a.id === addonId) {
          const newQty = Math.max(1, Math.min(99, a.quantity + delta));
          return { ...a, quantity: newQty };
        }
        return a;
      })
    );
  };

  const handleConfirmBooking = async () => {
    if (!internalService) return;

    setConfirmLoading(true);
    setConfirmError(null);

    try {
      const requestBody = {
        service_id: internalService.id,
        booking_date: format(selectedDate!, 'yyyy-MM-dd'),
        start_time: selectedTime || undefined,
        end_date: selectedEndDate ? format(selectedEndDate, 'yyyy-MM-dd') : null,
        nights: nights > 1 ? nights : null,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email || null,
        notes: customerInfo.notes || null,
        addons: selectedAddons.length > 0
          ? selectedAddons.map((a) => ({
              addon_id: a.id,
              quantity: a.quantity,
            }))
          : null,
      };

      const res = await fetch(`/api/public/business/${business.slug}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      if (data.success && data.data) {
        setBooking(data.data);
        setStep('success');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setConfirmError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!booking) return;
    try {
      await navigator.clipboard.writeText(booking.confirmationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadCalendar = () => {
    if (!booking) return;
    window.open(`/api/public/booking/${booking.confirmationCode}?format=ics`, '_blank');
  };

  const estimatedPoints = calculateEstimatedPoints(
    totalPrice,
    business.points_per_purchase,
    business.pesos_per_point
  );

  // Render different steps
  const renderServiceStep = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Select a Service</h2>
        <p className="text-sm text-muted-foreground">
          Choose the service you&apos;d like to book
        </p>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {services?.map((svc) => (
          <Card
            key={svc.id}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              internalService?.id === svc.id ? 'border-primary bg-primary/5' : 'border-border/50'
            }`}
            onClick={() => setInternalService(svc)}
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{svc.name}</p>
                  {svc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {svc.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDuration(svc.duration_minutes)}
                    </Badge>
                    {svc.price_centavos && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {formatPrice(svc.price_centavos)}
                      </Badge>
                    )}
                  </div>
                </div>
                {internalService?.id === svc.id && (
                  <div className="shrink-0 p-1 rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleServiceContinue}
        disabled={!internalService}
        className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground"
      >
        Continue
      </Button>
    </div>
  );

  const renderOptionsStep = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Customize Your Booking</h2>
        <p className="text-sm text-muted-foreground">
          Select duration and add-ons
        </p>
      </div>

      {/* Service Summary */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{internalService?.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {internalService && formatDuration(internalService.duration_minutes)}
                </Badge>
                {internalService?.price_centavos && (
                  <span className="text-xs text-muted-foreground">
                    {formatPrice(internalService.price_centavos)}/{isMultiDay || isFullDay ? 'night' : 'session'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duration selector for multi-day/full-day */}
      {(isMultiDay || isFullDay) && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="h-4 w-4 text-primary" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setNights(Math.max(1, nights - 1))}
                disabled={nights <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[80px]">
                <p className="text-2xl font-bold">{nights}</p>
                <p className="text-xs text-muted-foreground">
                  night{nights !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setNights(Math.min(30, nights + 1))}
                disabled={nights >= 30}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add-ons section */}
      {addons.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Add-ons
              <Badge variant="secondary" className="ml-auto text-xs">
                Optional
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {addons.map((addon) => {
              const selected = selectedAddons.find((a) => a.id === addon.id);
              return (
                <div
                  key={addon.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selected
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <Checkbox
                    checked={!!selected}
                    onCheckedChange={() => handleAddonToggle(addon)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{addon.name}</p>
                    {addon.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {addon.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">
                      {formatPrice(addon.price_centavos)}
                    </p>
                    {addon.duration_minutes && (
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(addon.duration_minutes)}
                      </p>
                    )}
                  </div>
                  {selected && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleAddonQuantity(addon.id, -1)}
                        disabled={selected.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">
                        {selected.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleAddonQuantity(addon.id, 1)}
                        disabled={selected.quantity >= 99}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Price breakdown */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="py-4">
          <div className="space-y-2">
            {internalService?.price_centavos && (
              <div className="flex justify-between text-sm">
                <span>
                  {internalService.name}
                  {nights > 1 && ` (${nights} nights)`}
                </span>
                <span>{formatPrice(internalService.price_centavos * nights)}</span>
              </div>
            )}
            {selectedAddons.map((addon) => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span>
                  {addon.name}
                  {addon.quantity > 1 && ` (${addon.quantity}x)`}
                </span>
                <span>{formatPrice(addon.priceCentavos * addon.quantity)}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {hasServiceStep && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Button
          onClick={handleOptionsContinue}
          className={`bg-gradient-to-r from-primary to-secondary text-primary-foreground ${
            hasServiceStep ? 'flex-1' : 'w-full'
          }`}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderDateStep = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">
          {isMultiDay ? 'Select Dates' : 'Select a Date'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isMultiDay
            ? 'Choose your check-in and check-out dates'
            : isFullDay
              ? 'Choose the day for your booking'
              : 'Choose when you\'d like to visit'}
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {internalService?.name}
            </CardTitle>
            {/* Compact navigation in upper right */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 px-2 text-xs hover:bg-primary/10 hover:text-primary"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleDateContinue}
                disabled={
                  isMultiDay
                    ? !rangeValue?.from || !rangeValue?.to || !rangeAvailability?.available || rangeLoading
                    : !selectedDate
                }
                className="h-8 px-3 text-xs bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            {isMultiDay ? (
              <DayPicker
                mode="range"
                selected={rangeValue}
                onSelect={(range) => {
                  setRangeValue(range);
                  if (range?.from) {
                    setSelectedDate(range.from);
                    setSelectedEndDate(range.to || null);
                  }
                }}
                disabled={disabledDays}
                numberOfMonths={1}
                showOutsideDays={false}
                className="p-0"
                classNames={{
                  months: 'flex flex-col gap-4',
                  month: 'space-y-2',
                  caption: 'flex flex-col gap-1 mb-1',
                  caption_label: 'text-sm font-medium text-center',
                  nav: 'flex items-center justify-end gap-1',
                  nav_button: 'h-5 w-5 rounded border border-border inline-flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors',
                  table: 'w-full border-collapse',
                  head_row: 'flex',
                  head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                  row: 'flex w-full mt-2',
                  cell: 'h-9 w-9 text-center text-sm p-0 relative',
                  day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md',
                  day_range_start: 'day-range-start',
                  day_range_end: 'day-range-end',
                  day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  day_range_middle: 'aria-selected:bg-primary/20 aria-selected:text-foreground',
                  day_today: 'bg-accent text-accent-foreground',
                  day_outside: 'text-muted-foreground opacity-50 aria-selected:bg-primary/50',
                  day_disabled: 'text-muted-foreground opacity-50',
                }}
              />
            ) : (
              <DayPicker
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => setSelectedDate(date || null)}
                disabled={disabledDays}
                numberOfMonths={1}
                showOutsideDays={false}
                className="p-0"
                classNames={{
                  months: 'flex flex-col gap-4',
                  month: 'space-y-2',
                  caption: 'flex flex-col gap-1 mb-1',
                  caption_label: 'text-sm font-medium text-center',
                  nav: 'flex items-center justify-end gap-1',
                  nav_button: 'h-5 w-5 rounded border border-border inline-flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors',
                  table: 'w-full border-collapse',
                  head_row: 'flex',
                  head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                  row: 'flex w-full mt-2',
                  cell: 'h-9 w-9 text-center text-sm p-0 relative',
                  day: 'h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md',
                  day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  day_today: 'bg-accent text-accent-foreground',
                  day_outside: 'text-muted-foreground opacity-50',
                  day_disabled: 'text-muted-foreground opacity-50',
                }}
              />
            )}
          </div>

          {/* Range availability info */}
          {isMultiDay && rangeValue?.from && rangeValue?.to && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              {rangeLoading ? (
                <p className="text-sm text-muted-foreground text-center">
                  Checking availability...
                </p>
              ) : rangeAvailability ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <Moon className="h-4 w-4 text-primary" />
                      {rangeAvailability.nights} night
                      {rangeAvailability.nights !== 1 ? 's' : ''}
                    </span>
                    {rangeAvailability.available ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Not Available</Badge>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Single date selection info */}
          {!isMultiDay && selectedDate && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm">
                Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTimeStep = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Select a Time</h2>
        <p className="text-sm text-muted-foreground">
          Choose an available time slot
        </p>
      </div>

      {/* Selected date summary */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{internalService?.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time slots */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Available Times
            {businessHours && (
              <Badge variant="outline" className="ml-auto font-normal text-xs">
                {formatTimeForDisplay(businessHours.open)} -{' '}
                {formatTimeForDisplay(businessHours.close)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : timeError ? (
            <div className="text-center py-6">
              <p className="text-sm text-destructive">{timeError}</p>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No available time slots for this date.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please select a different date.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  variant="outline"
                  size="sm"
                  className="hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => handleTimeContinue(slot)}
                >
                  {formatTimeForDisplay(slot)}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back button */}
      <Button
        variant="outline"
        onClick={handleBack}
        className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary/30"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Date Selection
      </Button>
    </div>
  );

  const renderInfoStep = () => {
    const InfoForm = () => {
      const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm<CustomerInfoFormData>({
        resolver: zodResolver(CustomerInfoSchema),
        mode: 'onChange',
        defaultValues: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email,
          notes: customerInfo.notes,
        },
      });

      const onSubmit = (data: CustomerInfoFormData) => {
        handleInfoContinue({
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          notes: data.notes || '',
        });
      };

      return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Juan Dela Cruz"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="09171234567"
              {...register('phone')}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@example.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2 text-sm">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Special Requests <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Any special requests..."
              rows={2}
              {...register('notes')}
              className={errors.notes ? 'border-destructive' : ''}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground"
          >
            Continue to Confirm
          </Button>
        </form>
      );
    };

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Your Information</h2>
          <p className="text-sm text-muted-foreground">
            Please provide your contact details
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoForm />
          </CardContent>
        </Card>

        {/* Back button */}
        <Button
          variant="outline"
          onClick={handleBack}
          className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary/30"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
    );
  };

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Confirm Your Booking</h2>
        <p className="text-sm text-muted-foreground">
          Review your booking details
        </p>
      </div>

      {/* Booking Summary */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Service */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{internalService?.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {internalService && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {nights > 1 ? `${nights} nights` : formatDuration(internalService.duration_minutes)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              {selectedEndDate && (
                <p className="text-xs text-muted-foreground">
                  to {format(selectedEndDate, 'EEEE, MMMM d, yyyy')}
                </p>
              )}
              {isTimeBased && selectedTime && (
                <p className="text-xs text-muted-foreground">
                  {formatTimeForDisplay(selectedTime)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <p className="font-medium text-sm">{customerInfo.name}</p>
            </div>
            <div className="flex items-center gap-3 ml-10">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs">{customerInfo.phone}</p>
            </div>
            {customerInfo.email && (
              <div className="flex items-center gap-3 ml-10">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs">{customerInfo.email}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="py-4">
          <div className="space-y-2">
            {internalService?.price_centavos && (
              <div className="flex justify-between text-sm">
                <span>
                  {internalService.name}
                  {nights > 1 && ` (${nights} nights)`}
                </span>
                <span>{formatPrice(internalService.price_centavos * nights)}</span>
              </div>
            )}
            {selectedAddons.map((addon) => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span>
                  {addon.name}
                  {addon.quantity > 1 && ` (${addon.quantity}x)`}
                </span>
                <span>{formatPrice(addon.priceCentavos * addon.quantity)}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Preview */}
      {estimatedPoints > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  Earn {estimatedPoints} loyalty point{estimatedPoints !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  Redeemable for rewards at {business.name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {confirmError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{confirmError}</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={confirmLoading}
          className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleConfirmBooking}
          disabled={confirmLoading}
          className="flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
        >
          {confirmLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        By confirming, you agree to the booking terms.
      </p>
    </div>
  );

  const renderSuccessStep = () => {
    if (!booking) return null;

    return (
      <div className="space-y-4">
        {/* Success Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-1">Booking Confirmed!</h2>
          <p className="text-sm text-muted-foreground">
            Your appointment has been scheduled
          </p>
        </div>

        {/* Confirmation Code */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Confirmation Code
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold tracking-wider">
                {booking.confirmationCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
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
        <Card className="border-border/50">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{internalService?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  {selectedEndDate && (
                    <> to {format(selectedEndDate, 'MMMM d, yyyy')}</>
                  )}
                </p>
                {isTimeBased && selectedTime && (
                  <Badge variant="outline" className="mt-1 gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {formatTimeForDisplay(selectedTime)}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {business.address && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs">{business.address}</p>
              </div>
            )}

            {business.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <a
                  href={`tel:${business.phone}`}
                  className="text-xs text-primary hover:underline"
                >
                  {business.phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Paid */}
        {booking.totalPriceCentavos > 0 && (
          <Card className="border-border/50">
            <CardContent className="py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-semibold text-lg">
                  {formatPrice(booking.totalPriceCentavos)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Points Earned */}
        {booking.pointsEarned > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    +{booking.pointsEarned} point{booking.pointsEarned !== 1 ? 's' : ''} earned!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.isNewCustomer
                      ? 'Welcome! Your loyalty card has been created.'
                      : 'Points added to your loyalty card.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDownloadCalendar}
          >
            <Download className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>

          {booking.cardToken && (
            <Button
              asChild
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground"
            >
              <Link href={`/card/${booking.cardToken}`}>
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
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto px-6 py-6">
        <SheetHeader className="space-y-0 pb-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg">Book Appointment</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {business.name}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Progress indicator */}
        {step !== 'success' && (
          <div className="space-y-2 mb-8 px-1">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Step {currentStepIndex + 1} of {maxSteps}
            </p>
          </div>
        )}

        {/* Step content */}
        <div className="px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 'service' && renderServiceStep()}
              {step === 'options' && renderOptionsStep()}
              {step === 'date' && renderDateStep()}
              {step === 'time' && renderTimeStep()}
              {step === 'info' && renderInfoStep()}
              {step === 'confirm' && renderConfirmStep()}
              {step === 'success' && renderSuccessStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
