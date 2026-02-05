// apps/web/components/booking/fields/HotelBookingFields.tsx
'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { DateRangePicker } from './DateRangePicker';
import { GuestCounter } from './GuestCounter';

interface PriceVariant {
  id: string;
  name: string;
  price_centavos: number;
  description: string | null;
  capacity: number | null;
}

interface HotelBookingFieldsProps {
  // Room type / variant selection
  variants: PriceVariant[];
  selectedVariant: PriceVariant | null;
  onVariantSelect: (variant: PriceVariant | null) => void;

  // Dates
  checkInDate: Date | null;
  checkOutDate: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  closedDaysOfWeek?: number[];

  // Guests
  adultsCount: number;
  childrenCount: number;
  maxGuests: number;
  onAdultsChange: (count: number) => void;
  onChildrenChange: (count: number) => void;
  onIncrementAdults: () => void;
  onDecrementAdults: () => void;
  onIncrementChildren: () => void;
  onDecrementChildren: () => void;

  // Check-in/out info from service config
  checkInTime?: string;
  checkOutTime?: string;

  // Stay duration limits from service config
  minStayNights?: number;
  maxStayNights?: number;
  advanceBookingDays?: number;

  disabled?: boolean;
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

export function HotelBookingFields({
  variants,
  selectedVariant,
  onVariantSelect,
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  closedDaysOfWeek = [],
  adultsCount,
  childrenCount,
  maxGuests,
  onAdultsChange,
  onChildrenChange,
  onIncrementAdults,
  onDecrementAdults,
  onIncrementChildren,
  onDecrementChildren,
  checkInTime,
  checkOutTime,
  minStayNights,
  maxStayNights,
  advanceBookingDays,
  disabled = false,
  className,
}: HotelBookingFieldsProps) {
  // Calculate max guests from selected variant or default
  const effectiveMaxGuests = selectedVariant?.capacity || maxGuests;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Room Type Selection - only show if there are variants */}
      {variants.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Room Type</Label>
          <Select
            value={selectedVariant?.id || ''}
            disabled={disabled}
            onValueChange={(value) => {
              if (disabled) return;
              const variant = variants.find((v) => v.id === value);
              onVariantSelect(variant || null);
            }}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select room type..." />
            </SelectTrigger>
            <SelectContent>
              {variants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id}>
                  {variant.name} - {formatPrice(variant.price_centavos)}/night
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedVariant?.description && (
            <p className="text-xs text-gray-500">
              {selectedVariant.description}
            </p>
          )}
        </div>
      )}

      {/* Check-in / Check-out Dates */}
      <DateRangePicker
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        onCheckInChange={onCheckInChange}
        onCheckOutChange={onCheckOutChange}
        closedDaysOfWeek={closedDaysOfWeek}
        minStayNights={minStayNights}
        maxStayNights={maxStayNights}
        advanceBookingDays={advanceBookingDays}
        disabled={disabled}
      />
      {(checkInTime || checkOutTime) && (
        <p className="text-xs text-gray-500 mt-1">
          Check-in: {checkInTime || '14:00'} | Check-out: {checkOutTime || '11:00'}
        </p>
      )}

      {/* Number of Guests */}
      <GuestCounter
        adultsCount={adultsCount}
        childrenCount={childrenCount}
        maxGuests={effectiveMaxGuests}
        onAdultsChange={onAdultsChange}
        onChildrenChange={onChildrenChange}
        onIncrementAdults={onIncrementAdults}
        onDecrementAdults={onDecrementAdults}
        onIncrementChildren={onIncrementChildren}
        onDecrementChildren={onDecrementChildren}
        disabled={disabled}
      />
    </div>
  );
}
