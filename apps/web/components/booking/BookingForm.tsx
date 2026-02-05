// apps/web/components/booking/BookingForm.tsx
'use client';

import { Phone, User, Mail, FileText, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { HotelBookingFields } from './fields/HotelBookingFields';
import { RestaurantBookingFields } from './fields/RestaurantBookingFields';
import { SalonRetailBookingFields } from './fields/SalonRetailBookingFields';
import { AddonSelector } from './fields/AddonSelector';

import type { BookingAddon, SelectedAddon, PriceVariant } from '@/hooks/useBookingForm';

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

interface BookingFormProps {
  // Business type
  businessType: BusinessType | null;

  // Service configuration (from business form settings)
  serviceConfig: Record<string, unknown> | null;

  // Selected service ID (for time slot queries)
  serviceId: string | null;

  // Price variants (for hotels)
  variants: PriceVariant[];
  selectedVariant: PriceVariant | null;
  onVariantSelect: (variant: PriceVariant | null) => void;

  // Dates
  checkInDate: Date | null;
  checkOutDate: Date | null;
  selectedTime: string | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  onTimeChange: (time: string | null) => void;

  // Guests (hotel)
  adultsCount: number;
  childrenCount: number;
  maxGuests: number;
  onIncrementAdults: () => void;
  onDecrementAdults: () => void;
  onIncrementChildren: () => void;
  onDecrementChildren: () => void;
  onAdultsChange: (count: number) => void;
  onChildrenChange: (count: number) => void;

  // Party size (restaurant)
  partySize: number;
  onPartySizeChange: (size: number) => void;

  // Add-ons
  addons: AddonWithOptions[];
  selectedAddons: SelectedAddon[];
  onAddonToggle: (addon: BookingAddon) => void;
  onAddonQuantityChange: (addonId: string, quantity: number) => void;
  onAddonOptionChange?: (addonId: string, option: { id: string; name: string; priceCentavos: number } | null) => void;

  // Contact
  phone: string;
  name: string;
  email: string;
  specialRequests: string;
  onPhoneChange: (phone: string) => void;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onSpecialRequestsChange: (requests: string) => void;

  // Helpers
  businessSlug: string;
  closedDaysOfWeek: number[];

  // Disabled mode (for preview)
  disabled?: boolean;

  className?: string;
}


// ============================================
// COMPONENT
// ============================================

export function BookingForm({
  businessType,
  serviceConfig,
  serviceId,
  variants,
  selectedVariant,
  onVariantSelect,
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
  partySize,
  onPartySizeChange,
  addons,
  selectedAddons,
  onAddonToggle,
  onAddonQuantityChange,
  onAddonOptionChange,
  phone,
  name,
  email,
  specialRequests,
  onPhoneChange,
  onNameChange,
  onEmailChange,
  onSpecialRequestsChange,
  businessSlug,
  closedDaysOfWeek,
  disabled = false,
  className,
}: BookingFormProps) {
  // Check if this is the preview form
  const isPreview = className?.includes('preview-form');

  // Input classes for preview mode (white bg, black border, yellow focus)
  const inputClasses = isPreview
    ? 'h-9 text-sm bg-white border-gray-900 text-gray-900 placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400'
    : 'h-9 text-sm bg-white border-gray-300 text-gray-900 placeholder:text-gray-400';

  const labelClasses = isPreview
    ? 'flex items-center gap-1 text-xs text-gray-700'
    : 'flex items-center gap-1 text-xs text-gray-600';

  const sectionTitleClasses = isPreview
    ? 'font-semibold text-sm text-gray-900'
    : 'font-medium text-sm text-gray-900';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Guest Information - shown first */}
      <section className="space-y-3">
        <h4 className={sectionTitleClasses}>Guest Information</h4>

        <div className="grid grid-cols-2 gap-3">
          {/* Name - required */}
          <div className="space-y-1">
            <Label htmlFor="name" className={labelClasses}>
              <User className="h-3 w-3" />
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="Juan Dela Cruz"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={inputClasses}
              maxLength={100}
              disabled={disabled}
            />
          </div>

          {/* Phone - required */}
          <div className="space-y-1">
            <Label htmlFor="phone" className={labelClasses}>
              <Phone className="h-3 w-3" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="09171234567"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
              className={inputClasses}
              maxLength={15}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Email - optional */}
        <div className="space-y-1">
          <Label htmlFor="email" className={labelClasses}>
            <Mail className="h-3 w-3" />
            Email (optional)
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={inputClasses}
            maxLength={100}
            disabled={disabled}
          />
        </div>
      </section>

      <Separator className={isPreview ? 'bg-gray-900' : ''} />

      {/* Business-Type-Specific Section */}
      <section className="space-y-3">
        <h4 className={sectionTitleClasses}>
          {businessType === 'hotel'
            ? 'Accommodation'
            : businessType === 'restaurant'
            ? 'Reservation Details'
            : 'Appointment'}
        </h4>

        {businessType === 'hotel' && (() => {
          // Get capacity values
          const configCapacityMax = (serviceConfig as { capacity_max?: number } | null)?.capacity_max;
          const variantCapacity = selectedVariant?.capacity;
          // Use variant capacity if available, but cap it by config's capacity_max
          const effectiveMaxGuests = variantCapacity && configCapacityMax
            ? Math.min(variantCapacity, configCapacityMax)
            : variantCapacity || configCapacityMax || maxGuests;

          return (
            <HotelBookingFields
              variants={variants}
              selectedVariant={selectedVariant}
              onVariantSelect={onVariantSelect}
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onCheckInChange={onCheckInChange}
              onCheckOutChange={onCheckOutChange}
              closedDaysOfWeek={closedDaysOfWeek}
              adultsCount={adultsCount}
              childrenCount={childrenCount}
              maxGuests={effectiveMaxGuests}
              onAdultsChange={onAdultsChange}
              onChildrenChange={onChildrenChange}
              onIncrementAdults={onIncrementAdults}
              onDecrementAdults={onDecrementAdults}
              onIncrementChildren={onIncrementChildren}
              onDecrementChildren={onDecrementChildren}
              checkInTime={(serviceConfig as { check_in_time?: string } | null)?.check_in_time}
              checkOutTime={(serviceConfig as { check_out_time?: string } | null)?.check_out_time}
              minStayNights={(serviceConfig as { min_stay_nights?: number } | null)?.min_stay_nights}
              maxStayNights={(serviceConfig as { max_stay_nights?: number } | null)?.max_stay_nights}
              advanceBookingDays={(serviceConfig as { advance_booking_days?: number } | null)?.advance_booking_days}
              disabled={disabled}
            />
          );
        })()}

        {businessType === 'restaurant' && (
          <RestaurantBookingFields
            date={checkInDate}
            time={selectedTime}
            onDateChange={onCheckInChange}
            onTimeChange={onTimeChange}
            businessSlug={businessSlug}
            serviceId={serviceId}
            closedDaysOfWeek={closedDaysOfWeek}
            partySize={partySize}
            onPartySizeChange={onPartySizeChange}
            minPartySize={(serviceConfig as { party_size_min?: number } | null)?.party_size_min || 1}
            maxPartySize={(serviceConfig as { party_size_max?: number } | null)?.party_size_max || 20}
            disabled={disabled}
          />
        )}

        {(businessType === 'salon' || businessType === 'retail' || !businessType) && (
          <SalonRetailBookingFields
            date={checkInDate}
            time={selectedTime}
            onDateChange={onCheckInChange}
            onTimeChange={onTimeChange}
            businessSlug={businessSlug}
            serviceId={serviceId}
            closedDaysOfWeek={closedDaysOfWeek}
            disabled={disabled}
          />
        )}
      </section>

      {/* Add-ons */}
      {addons.length > 0 && (
        <>
          <Separator className={isPreview ? 'bg-gray-900' : ''} />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className={sectionTitleClasses}>
                {businessType === 'hotel' ? 'Add Experiences' : 'Add-ons'}
              </h4>
              <Badge className={isPreview ? 'text-xs ml-auto bg-yellow-100 text-gray-900 border border-gray-900' : 'text-xs ml-auto'} variant={isPreview ? undefined : 'secondary'}>
                <Sparkles className="h-3 w-3 mr-1" />
                Optional
              </Badge>
            </div>

            <AddonSelector
              addons={addons}
              selectedAddons={selectedAddons}
              onToggle={onAddonToggle}
              onQuantityChange={onAddonQuantityChange}
              onOptionChange={onAddonOptionChange}
              businessType={businessType}
              disabled={disabled}
            />
          </section>
        </>
      )}

      <Separator className={isPreview ? 'bg-gray-900' : ''} />

      {/* Special Requests */}
      <section className="space-y-2">
        <Label htmlFor="requests" className={labelClasses}>
          <FileText className="h-3 w-3" />
          Special Requests (optional)
        </Label>
        <Textarea
          id="requests"
          placeholder="Any special requests or notes..."
          value={specialRequests}
          onChange={(e) => onSpecialRequestsChange(e.target.value)}
          rows={2}
          className={isPreview ? 'text-sm resize-none bg-white border-gray-900 text-gray-900 placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400' : 'text-sm resize-none'}
          maxLength={500}
          disabled={disabled}
        />
      </section>
    </div>
  );
}
