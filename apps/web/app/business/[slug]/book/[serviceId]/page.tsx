// apps/web/app/business/[slug]/book/[serviceId]/page.tsx

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Phone, Mail, ChevronLeft, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DirectBookingPageProps {
  params: Promise<{ slug: string; serviceId: string }>;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_centavos: number | null;
}

interface TimeSlot {
  value: string;
  label: string;
  available: boolean;
}

interface BookingFormData {
  booking_date: string;
  start_time: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
}

type Step = 'datetime' | 'details' | 'confirmation';

function formatPrice(centavos: number | null): string {
  if (centavos === null) return 'Free';
  return `₱${(centavos / 100).toFixed(0)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function DirectBookingPage({ params }: DirectBookingPageProps) {
  const { slug, serviceId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('datetime');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [business, setBusiness] = useState<{ id: string; name: string } | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [formData, setFormData] = useState<BookingFormData>({
    booking_date: '',
    start_time: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    notes: '',
  });

  // Fetch business and service on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('slug', slug)
          .maybeSingle();

        if (businessError || !businessData) {
          setError('Business not found');
          return;
        }

        setBusiness(businessData);

        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('id, name, description, duration_minutes, price_centavos')
          .eq('id', serviceId)
          .eq('business_id', businessData.id)
          .eq('is_active', true)
          .maybeSingle();

        if (serviceError || !serviceData) {
          setError('Service not found');
          return;
        }

        setService(serviceData);
      } catch {
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug, serviceId, supabase]);

  // Fetch time slots when date changes
  useEffect(() => {
    async function fetchTimeSlots() {
      if (!business || !formData.booking_date || !service) {
        setTimeSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const dayOfWeek = new Date(formData.booking_date).getDay();

        const { data: availability } = await supabase
          .from('availability')
          .select('*')
          .eq('business_id', business.id)
          .eq('day_of_week', dayOfWeek)
          .is('branch_id', null)
          .is('staff_id', null)
          .maybeSingle();

        if (!availability || !availability.is_available) {
          setTimeSlots([]);
          return;
        }

        const slots: TimeSlot[] = [];
        const startMinutes = timeToMinutes(availability.start_time);
        const endMinutes = timeToMinutes(availability.end_time);
        const duration = service.duration_minutes;

        for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += 30) {
          const timeValue = minutesToTime(minutes);
          slots.push({
            value: timeValue,
            label: formatTimeForDisplay(timeValue),
            available: true,
          });
        }

        const { data: bookings } = await supabase
          .from('bookings')
          .select('start_time, end_time')
          .eq('business_id', business.id)
          .eq('booking_date', formData.booking_date)
          .neq('status', 'cancelled');

        const availableSlots = slots.map((slot) => {
          const slotEnd = minutesToTime(timeToMinutes(slot.value) + duration);
          const hasConflict = (bookings || []).some((booking) => {
            const slotStart = timeToMinutes(slot.value);
            const slotEndMin = timeToMinutes(slotEnd);
            const bookingStart = timeToMinutes(booking.start_time);
            const bookingEnd = timeToMinutes(booking.end_time);
            return slotStart < bookingEnd && slotEndMin > bookingStart;
          });
          return { ...slot, available: !hasConflict };
        });

        setTimeSlots(availableSlots);
      } catch {
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchTimeSlots();
  }, [business, formData.booking_date, service, supabase]);

  async function handleSubmit() {
    if (!business || !service) return;

    setSubmitting(true);
    setError(null);

    try {
      const endTime = minutesToTime(
        timeToMinutes(formData.start_time) + service.duration_minutes
      );

      const { error: insertError } = await supabase.from('bookings').insert({
        business_id: business.id,
        service_id: service.id,
        customer_id: null,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone || null,
        customer_email: formData.customer_email || null,
        booking_date: formData.booking_date,
        start_time: formData.start_time,
        end_time: endTime,
        staff_id: null,
        notes: formData.notes || null,
        status: 'pending',
      });

      if (insertError) {
        setError('Failed to create booking. Please try again.');
        return;
      }

      setStep('confirmation');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && (!business || !service)) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => router.push(`/business/${slug}`)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirmation step
  if (step === 'confirmation') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold">Booking Requested!</h2>
            <p className="mb-6 text-muted-foreground">
              Your booking request has been submitted. {business?.name} will confirm your
              appointment soon.
            </p>
            <div className="mb-6 rounded-lg bg-muted p-4 text-left">
              <p className="font-medium">{service?.name}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(formData.booking_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at {formatTimeForDisplay(formData.start_time)}
              </p>
            </div>
            <Button onClick={() => router.push(`/business/${slug}`)}>Back to Store</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Service info header */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">{service?.name}</h2>
            {service?.description && (
              <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
            )}
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {formatDuration(service?.duration_minutes || 0)}
              </Badge>
            </div>
          </div>
          <span className="shrink-0 font-semibold text-primary">
            {formatPrice(service?.price_centavos || null)}
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {(['datetime', 'details'] as const).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : ['datetime', 'details'].indexOf(step) > i
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            {i < 1 && (
              <div
                className={`mx-2 h-0.5 w-8 ${
                  ['datetime', 'details'].indexOf(step) > i ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        {/* Step 1: Select Date & Time */}
        {step === 'datetime' && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push(`/business/${slug}/services`)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Select Date & Time</CardTitle>
                  <CardDescription>Choose when you&apos;d like to come in</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Date</Label>
                  <CalendarComponent
                    mode="single"
                    selected={formData.booking_date ? new Date(formData.booking_date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData((prev) => ({
                          ...prev,
                          booking_date: date.toISOString().split('T')[0],
                          start_time: '',
                        }));
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Time</Label>
                  {!formData.booking_date ? (
                    <p className="text-sm text-muted-foreground">Please select a date first</p>
                  ) : loadingSlots ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No available time slots for this date
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.value}
                          variant={formData.start_time === slot.value ? 'default' : 'outline'}
                          disabled={!slot.available}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, start_time: slot.value }))
                          }
                          className="w-full"
                        >
                          {slot.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setStep('details')}
                  disabled={!formData.booking_date || !formData.start_time}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Customer Details */}
        {step === 'details' && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" onClick={() => setStep('datetime')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Your Details</CardTitle>
                  <CardDescription>
                    {service?.name} on{' '}
                    {new Date(formData.booking_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at {formatTimeForDisplay(formData.start_time)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    <User className="mr-1 inline h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customer_name: e.target.value }))
                    }
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">
                    <Phone className="mr-1 inline h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customer_phone: e.target.value }))
                    }
                    placeholder="09XX XXX XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="email">
                    <Mail className="mr-1 inline h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customer_email: e.target.value }))
                    }
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Any special requests or notes..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.customer_name || submitting}
                >
                  {submitting ? 'Submitting...' : 'Book Appointment'}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
