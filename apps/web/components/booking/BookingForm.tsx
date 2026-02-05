// apps/web/components/booking/BookingForm.tsx
'use client';

import { Phone, User, FileText, Clock, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { DateRangePicker } from './fields/DateRangePicker';
import { DateTimePicker } from './fields/DateTimePicker';
import { GuestCounter } from './fields/GuestCounter';
import { AddonSelector } from './fields/AddonSelector';

import type { BookingService, BookingAddon, SelectedAddon } from '@/hooks/useBookingForm';

// ============================================
// TYPES
// ============================================

interface BookingFormProps {
  // Services
  services: BookingService[];
  selectedService: BookingService | null;
  onServiceSelect: (service: BookingService | null) => void;

  // Dates
  checkInDate: Date | null;
  checkOutDate: Date | null;
  selectedTime: string | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  onTimeChange: (time: string | null) => void;

  // Guests
  adultsCount: number;
  childrenCount: number;
  maxGuests: number;
  onIncrementAdults: () => void;
  onDecrementAdults: () => void;
  onIncrementChildren: () => void;
  onDecrementChildren: () => void;
  onAdultsChange: (count: number) => void;
  onChildrenChange: (count: number) => void;

  // Add-ons
  addons: BookingAddon[];
  selectedAddons: SelectedAddon[];
  onAddonToggle: (addon: BookingAddon) => void;
  onAddonQuantityChange: (addonId: string, quantity: number) => void;

  // Contact
  phone: string;
  name: string;
  specialRequests: string;
  onPhoneChange: (phone: string) => void;
  onNameChange: (name: string) => void;
  onSpecialRequestsChange: (requests: string) => void;

  // Helpers
  isMultiDay: boolean;
  requiresTimeSlot: boolean;
  businessSlug: string;
  closedDaysOfWeek: number[];

  className?: string;
}

function formatPrice(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

// ============================================
// COMPONENT
// ============================================

export function BookingForm({
  services,
  selectedService,
  onServiceSelect,
  checkInDate,
  checkOutDate,
  selectedTime,
  onCheckInChange,
  onCheckOutChange,
  onTimeChange,
  adultsCount,
  childrenCount,
  maxGuests,
  onIncrementAdults,
  onDecrementAdults,
  onIncrementChildren,
  onDecrementChildren,
  onAdultsChange,
  onChildrenChange,
  addons,
  selectedAddons,
  onAddonToggle,
  onAddonQuantityChange,
  phone,
  name,
  specialRequests,
  onPhoneChange,
  onNameChange,
  onSpecialRequestsChange,
  isMultiDay,
  requiresTimeSlot,
  businessSlug,
  closedDaysOfWeek,
  className,
}: BookingFormProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Service Selection */}
      <section className="space-y-4">
        <h3 className="font-semibold">Select Service</h3>

        <Select
          value={selectedService?.id || ''}
          onValueChange={(value) => {
            const service = services.find((s) => s.id === value);
            onServiceSelect(service || null);
          }}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Choose a service..." />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                <div className="flex items-center justify-between w-full gap-4">
                  <span>{service.name}</span>
                  <span className="text-muted-foreground text-sm">
                    {service.price_centavos && formatPrice(service.price_centavos)}
                    {service.price_centavos && (
                      <span className="ml-1">
                        /{service.price_type === 'per_night' ? 'night' : 'session'}
                      </span>
                    )}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Show selected service details */}
        {selectedService && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-medium">{selectedService.name}</p>
            {selectedService.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedService.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {formatDuration(selectedService.duration_minutes)}
              </Badge>
              {selectedService.max_guests > 1 && (
                <Badge variant="outline" className="text-xs">
                  Max {selectedService.max_guests} guests
                </Badge>
              )}
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* Date/Time Selection */}
      <section className="space-y-4">
        <h3 className="font-semibold">Choose Date & Time</h3>

        {isMultiDay ? (
          <DateRangePicker
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            onCheckInChange={onCheckInChange}
            onCheckOutChange={onCheckOutChange}
            closedDaysOfWeek={closedDaysOfWeek}
          />
        ) : (
          <DateTimePicker
            date={checkInDate}
            time={selectedTime}
            onDateChange={onCheckInChange}
            onTimeChange={onTimeChange}
            businessSlug={businessSlug}
            serviceId={selectedService?.id || ''}
            closedDaysOfWeek={closedDaysOfWeek}
          />
        )}
      </section>

      {/* Guests (only for multi-guest services) */}
      {maxGuests > 1 && (
        <>
          <Separator />

          <section className="space-y-4">
            <h3 className="font-semibold">Guests</h3>

            <GuestCounter
              adultsCount={adultsCount}
              childrenCount={childrenCount}
              maxGuests={maxGuests}
              onAdultsChange={onAdultsChange}
              onChildrenChange={onChildrenChange}
              onIncrementAdults={onIncrementAdults}
              onDecrementAdults={onDecrementAdults}
              onIncrementChildren={onIncrementChildren}
              onDecrementChildren={onDecrementChildren}
            />
          </section>
        </>
      )}

      {/* Add-ons */}
      {addons.length > 0 && (
        <>
          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Add-ons</h3>
              <Badge variant="secondary" className="text-xs ml-auto">
                <Sparkles className="h-3 w-3 mr-1" />
                Optional
              </Badge>
            </div>

            <AddonSelector
              addons={addons}
              selectedAddons={selectedAddons}
              onToggle={onAddonToggle}
              onQuantityChange={onAddonQuantityChange}
            />
          </section>
        </>
      )}

      <Separator />

      {/* Contact Information */}
      <section className="space-y-4">
        <h3 className="font-semibold">Your Contact</h3>

        <div className="space-y-4">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="09171234567"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
              className="h-11"
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll use this to find or create your loyalty card
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              Name <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="name"
              placeholder="Juan Dela Cruz"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="h-11"
              maxLength={100}
            />
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="requests" className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Special Requests{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="requests"
              placeholder="Any special requests or notes..."
              value={specialRequests}
              onChange={(e) => onSpecialRequestsChange(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
