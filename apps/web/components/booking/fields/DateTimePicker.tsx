// apps/web/components/booking/fields/DateTimePicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import 'react-day-picker/style.css';

interface DateTimePickerProps {
  date: Date | null;
  time: string | null;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string | null) => void;
  businessSlug: string;
  serviceId: string | null;
  disabledDays?: (date: Date) => boolean;
  closedDaysOfWeek?: number[];
  disabled?: boolean;
  className?: string;
}

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  businessSlug,
  serviceId,
  disabledDays,
  closedDaysOfWeek = [],
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultClassNames = getDefaultClassNames();

  // Fetch time slots when date changes
  useEffect(() => {
    if (!date || !serviceId) {
      setTimeSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSlotsError(null);

      try {
        const dateStr = format(date, 'yyyy-MM-dd');
        const res = await fetch(
          `/api/public/business/${businessSlug}/availability?date=${dateStr}&service_id=${serviceId}`
        );

        if (!res.ok) {
          throw new Error('Failed to fetch time slots');
        }

        const data = await res.json();
        if (data.success && data.data?.slots) {
          setTimeSlots(data.data.slots);
        } else {
          setTimeSlots([]);
        }
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setSlotsError('Unable to load available times');
        setTimeSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [date, serviceId, businessSlug]);

  // Reset time when date changes
  useEffect(() => {
    onTimeChange(null);
  }, [date, onTimeChange]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate || null);
    setDateOpen(false);
  };

  const handleTimeSelect = (selectedTime: string) => {
    onTimeChange(selectedTime);
  };

  // Combine disabled days for the calendar
  // In react-day-picker v9, use { dayOfWeek: [...] } for disabling specific days
  const disabledDates = [
    { before: today },
    ...(closedDaysOfWeek.length > 0
      ? [{ dayOfWeek: closedDaysOfWeek }]
      : []),
    ...(disabledDays ? [disabledDays] : []),
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {/* Date Selection */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Date</Label>

        <Popover open={disabled ? false : dateOpen} onOpenChange={disabled ? undefined : setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-full justify-start text-left font-normal h-9 text-sm',
                !date && 'text-gray-500'
              )}
            >
              <CalendarDays className="mr-2 h-3 w-3" />
              {date ? format(date, 'MMM d, yyyy') : 'Select date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DayPicker
              mode="single"
              selected={date || undefined}
              onSelect={handleDateSelect}
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
                day: `h-9 w-9 text-center text-sm p-0 relative font-normal hover:bg-gray-100 hover:text-gray-900 rounded-md ${defaultClassNames.day}`,
                selected: `bg-gray-900 text-white hover:bg-gray-800 hover:text-white ${defaultClassNames.selected}`,
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

      {/* Time Selection */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Time</Label>

        {disabled ? (
          <Select disabled>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
          </Select>
        ) : isLoadingSlots ? (
          <div className="flex items-center justify-center h-9 border rounded-md bg-gray-100/30">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          </div>
        ) : slotsError ? (
          <Select disabled>
            <SelectTrigger className="h-9 text-sm text-red-600">
              <SelectValue placeholder="Error loading" />
            </SelectTrigger>
          </Select>
        ) : !date ? (
          <Select disabled>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
          </Select>
        ) : timeSlots.length === 0 ? (
          <Select disabled>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="No times available" />
            </SelectTrigger>
          </Select>
        ) : (
          <Select value={time || ''} onValueChange={handleTimeSelect}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {formatTimeForDisplay(slot)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
