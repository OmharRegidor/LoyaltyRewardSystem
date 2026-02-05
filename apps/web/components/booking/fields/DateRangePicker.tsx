// apps/web/components/booking/fields/DateRangePicker.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
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
  className?: string;
}

export function DateRangePicker({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  disabledDays,
  closedDaysOfWeek = [],
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const range: DateRange | undefined =
    checkInDate || checkOutDate
      ? { from: checkInDate || undefined, to: checkOutDate || undefined }
      : undefined;

  const handleSelect = (newRange: DateRange | undefined) => {
    onCheckInChange(newRange?.from || null);
    onCheckOutChange(newRange?.to || null);

    // Close popover when both dates are selected
    if (newRange?.from && newRange?.to) {
      setOpen(false);
    }
  };

  // Combine disabled days
  const disabled = [
    { before: today },
    ...(closedDaysOfWeek.length > 0
      ? [(date: Date) => closedDaysOfWeek.includes(date.getDay())]
      : []),
    ...(disabledDays ? [disabledDays] : []),
  ];

  const formatDateRange = () => {
    if (!checkInDate) return 'Select dates';
    if (!checkOutDate) return format(checkInDate, 'MMM d, yyyy');
    return `${format(checkInDate, 'MMM d')} - ${format(checkOutDate, 'MMM d, yyyy')}`;
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-2 text-sm font-medium">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        Check-in / Check-out
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-11',
              !checkInDate && 'text-muted-foreground'
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            disabled={disabled}
            numberOfMonths={1}
            showOutsideDays={false}
            className="p-3"
            classNames={{
              months: 'flex flex-col gap-4',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'space-x-1 flex items-center',
              nav_button:
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent hover:text-accent-foreground',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell:
                'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
              row: 'flex w-full mt-2',
              cell: 'h-9 w-9 text-center text-sm p-0 relative',
              day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md',
              day_range_start: 'day-range-start',
              day_range_end: 'day-range-end',
              day_selected:
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_range_middle:
                'aria-selected:bg-primary/20 aria-selected:text-foreground',
              day_today: 'bg-accent text-accent-foreground',
              day_outside: 'text-muted-foreground opacity-50',
              day_disabled: 'text-muted-foreground opacity-50',
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

      {checkInDate && checkOutDate && (
        <p className="text-xs text-muted-foreground">
          {Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
          )}{' '}
          night(s)
        </p>
      )}
    </div>
  );
}
