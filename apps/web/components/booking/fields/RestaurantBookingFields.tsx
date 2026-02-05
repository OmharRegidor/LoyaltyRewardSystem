// apps/web/components/booking/fields/RestaurantBookingFields.tsx
'use client';

import { Users, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { DateTimePicker } from './DateTimePicker';

interface RestaurantBookingFieldsProps {
  // Date & Time
  date: Date | null;
  time: string | null;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string | null) => void;
  businessSlug: string;
  serviceId: string | null;
  closedDaysOfWeek?: number[];

  // Party Size
  partySize: number;
  onPartySizeChange: (size: number) => void;
  minPartySize?: number;
  maxPartySize?: number;

  disabled?: boolean;
  className?: string;
}

export function RestaurantBookingFields({
  date,
  time,
  onDateChange,
  onTimeChange,
  businessSlug,
  serviceId,
  closedDaysOfWeek = [],
  partySize,
  onPartySizeChange,
  minPartySize = 1,
  maxPartySize = 20,
  disabled = false,
  className,
}: RestaurantBookingFieldsProps) {
  const incrementPartySize = () => {
    if (partySize < maxPartySize) {
      onPartySizeChange(partySize + 1);
    }
  };

  const decrementPartySize = () => {
    if (partySize > minPartySize) {
      onPartySizeChange(partySize - 1);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Party Size */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Party Size</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={decrementPartySize}
            disabled={disabled || partySize <= minPartySize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-3">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{partySize}</span>
            <span className="text-xs text-gray-500">guests</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={incrementPartySize}
            disabled={disabled || partySize >= maxPartySize}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          {minPartySize} - {maxPartySize} guests
        </p>
      </div>

      {/* Date & Time */}
      <DateTimePicker
        date={date}
        time={time}
        onDateChange={onDateChange}
        onTimeChange={onTimeChange}
        businessSlug={businessSlug}
        serviceId={serviceId}
        closedDaysOfWeek={closedDaysOfWeek}
        disabled={disabled}
      />
    </div>
  );
}
