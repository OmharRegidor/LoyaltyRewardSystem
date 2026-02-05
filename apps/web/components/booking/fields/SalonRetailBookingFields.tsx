// apps/web/components/booking/fields/SalonRetailBookingFields.tsx
'use client';

import { cn } from '@/lib/utils';
import { DateTimePicker } from './DateTimePicker';

interface SalonRetailBookingFieldsProps {
  // Date & Time
  date: Date | null;
  time: string | null;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string | null) => void;
  businessSlug: string;
  serviceId: string | null;
  closedDaysOfWeek?: number[];

  disabled?: boolean;
  className?: string;
}

export function SalonRetailBookingFields({
  date,
  time,
  onDateChange,
  onTimeChange,
  businessSlug,
  serviceId,
  closedDaysOfWeek = [],
  disabled = false,
  className,
}: SalonRetailBookingFieldsProps) {
  return (
    <div className={cn('space-y-4', className)}>
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
