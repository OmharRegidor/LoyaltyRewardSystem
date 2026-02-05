// apps/web/components/booking/fields/DateTimePicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { CalendarDays, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  className,
}: DateTimePickerProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  // Combine disabled days
  const disabled = [
    { before: today },
    ...(closedDaysOfWeek.length > 0
      ? [(d: Date) => closedDaysOfWeek.includes(d.getDay())]
      : []),
    ...(disabledDays ? [disabledDays] : []),
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Date Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Date
        </Label>

        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-11',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {date ? format(date, 'EEEE, MMMM d, yyyy') : 'Select a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DayPicker
              mode="single"
              selected={date || undefined}
              onSelect={handleDateSelect}
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
                day: 'h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md',
                day_selected:
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
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
      </div>

      {/* Time Selection */}
      {date && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Time
          </Label>

          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-6 border rounded-lg bg-muted/30">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">
                Loading available times...
              </span>
            </div>
          ) : slotsError ? (
            <div className="p-4 border rounded-lg bg-destructive/10 text-destructive text-sm">
              {slotsError}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="p-4 border rounded-lg bg-muted/30 text-center">
              <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No available times for this date.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please select a different date.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={time === slot ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-9',
                    time === slot && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => handleTimeSelect(slot)}
                >
                  {formatTimeForDisplay(slot)}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
