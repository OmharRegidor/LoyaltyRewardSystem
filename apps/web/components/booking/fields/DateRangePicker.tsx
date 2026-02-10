// apps/web/components/booking/fields/DateRangePicker.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { DayPicker, DateRange, getDefaultClassNames } from 'react-day-picker';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import 'react-day-picker/style.css';

interface DateRangePickerProps {
  checkInDate: Date | null;
  checkOutDate: Date | null;
  onCheckInChange: (date: Date | null) => void;
  onCheckOutChange: (date: Date | null) => void;
  disabledDays?: (date: Date) => boolean;
  closedDaysOfWeek?: number[];
  // Stay duration limits from service config
  minStayNights?: number;
  maxStayNights?: number;
  advanceBookingDays?: number;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  disabledDays,
  closedDaysOfWeek = [],
  minStayNights = 1,
  maxStayNights = 365,
  advanceBookingDays = 90,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultClassNames = getDefaultClassNames();

  // Calculate max booking date based on advance booking days
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + advanceBookingDays);

  const range: DateRange | undefined =
    checkInDate || checkOutDate
      ? { from: checkInDate || undefined, to: checkOutDate || undefined }
      : undefined;

  const handleSelect = (newRange: DateRange | undefined) => {
    if (newRange?.from && newRange?.to) {
      // Calculate nights
      const nights = Math.ceil(
        (newRange.to.getTime() - newRange.from.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Enforce min/max stay nights
      if (nights < minStayNights) {
        // Auto-adjust checkout to minimum stay
        const adjustedCheckout = new Date(newRange.from);
        adjustedCheckout.setDate(adjustedCheckout.getDate() + minStayNights);
        onCheckInChange(newRange.from);
        onCheckOutChange(adjustedCheckout);
        setOpen(false);
        return;
      }

      if (nights > maxStayNights) {
        // Auto-adjust checkout to maximum stay
        const adjustedCheckout = new Date(newRange.from);
        adjustedCheckout.setDate(adjustedCheckout.getDate() + maxStayNights);
        onCheckInChange(newRange.from);
        onCheckOutChange(adjustedCheckout);
        setOpen(false);
        return;
      }
    }

    onCheckInChange(newRange?.from || null);
    onCheckOutChange(newRange?.to || null);

    // Close popover when both dates are selected
    if (newRange?.from && newRange?.to) {
      setOpen(false);
    }
  };

  // Combine disabled days for the calendar
  // In react-day-picker v9, use { dayOfWeek: [...] } for disabling specific days
  const disabledDates = [
    { before: today },
    { after: maxDate },
    ...(closedDaysOfWeek.length > 0
      ? [{ dayOfWeek: closedDaysOfWeek }]
      : []),
    ...(disabledDays ? [disabledDays] : []),
  ];

  return (
    <div className={cn('space-y-1', className)}>
      <div className="grid grid-cols-2 gap-3">
        {/* Check-in */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Check-in</Label>
          <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={disabled}
                className={cn(
                  'w-full justify-start text-left font-normal h-9 text-sm',
                  !checkInDate && 'text-gray-500'
                )}
              >
                <CalendarDays className="mr-2 h-3 w-3" />
                {checkInDate ? format(checkInDate, 'MMM d, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={handleSelect}
                disabled={disabledDates}
                numberOfMonths={1}
                showOutsideDays={false}
                className="p-3"
                classNames={{
                  months: `flex flex-col gap-4 ${defaultClassNames.months}`,
                  month: `space-y-4 ${defaultClassNames.month}`,
                  month_caption: `flex justify-center pt-1 relative items-center ${defaultClassNames.month_caption}`,
                  caption_label: `text-sm font-medium ${defaultClassNames.caption_label}`,
                  nav: `space-x-1 flex items-center ${defaultClassNames.nav}`,
                  button_previous: `absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 hover:text-gray-900 ${defaultClassNames.button_previous}`,
                  button_next: `absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 hover:text-gray-900 ${defaultClassNames.button_next}`,
                  weekdays: `flex ${defaultClassNames.weekdays}`,
                  weekday: `text-gray-500 rounded-md w-9 font-normal text-[0.8rem] ${defaultClassNames.weekday}`,
                  week: `flex w-full mt-2 ${defaultClassNames.week}`,
                  day: `h-9 w-9 text-center text-sm p-0 relative font-normal aria-selected:opacity-100 hover:bg-gray-100 hover:text-gray-900 rounded-md ${defaultClassNames.day}`,
                  range_start: `bg-gray-900 text-white ${defaultClassNames.range_start}`,
                  range_end: `bg-gray-900 text-white ${defaultClassNames.range_end}`,
                  selected: `bg-gray-900 text-white hover:bg-gray-800 hover:text-white focus:bg-gray-900 focus:text-white ${defaultClassNames.selected}`,
                  range_middle: `bg-gray-200 text-gray-900 ${defaultClassNames.range_middle}`,
                  today: `bg-yellow-100 text-gray-900 ${defaultClassNames.today}`,
                  outside: `text-gray-500 opacity-50 ${defaultClassNames.outside}`,
                  disabled: `text-gray-500 opacity-50 ${defaultClassNames.disabled}`,
                }}
                components={{
                  Chevron: ({ orientation }) =>
                    orientation === 'left' ? (
                      <ChevronLeft className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    ),
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Check-out */}
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Check-out</Label>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-9 text-sm',
              !checkOutDate && 'text-gray-500'
            )}
            onClick={() => !disabled && setOpen(true)}
          >
            <CalendarDays className="mr-2 h-3 w-3" />
            {checkOutDate ? format(checkOutDate, 'MMM d, yyyy') : 'Select date'}
          </Button>
        </div>
      </div>

      {checkInDate && checkOutDate && (
        <p className="text-xs text-gray-500">
          {Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
          )}{' '}
          night(s)
          {(minStayNights > 1 || maxStayNights < 365) && (
            <span className="ml-1">
              ({minStayNights}-{maxStayNights} nights allowed)
            </span>
          )}
        </p>
      )}
      {checkInDate && !checkOutDate && (minStayNights > 1 || maxStayNights < 365) && (
        <p className="text-xs text-gray-500">
          Stay: {minStayNights}-{maxStayNights} nights
        </p>
      )}
    </div>
  );
}
