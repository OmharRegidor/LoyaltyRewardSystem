// apps/web/app/dashboard/booking/availability/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase';
import { getAvailability, saveAvailability } from '@/lib/services/booking.service';
import { motion } from 'framer-motion';
import { Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { AvailabilityFormData } from '@/types/booking.types';

// ============================================
// CONSTANTS
// ============================================

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const DEFAULT_AVAILABILITY: AvailabilityFormData[] = [
  { day_of_week: 0, is_available: false, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 1, is_available: true, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 2, is_available: true, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 3, is_available: true, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 4, is_available: true, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 5, is_available: true, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 6, is_available: true, start_time: '09:00', end_time: '12:00' },
];

// Generate time options from 6:00 AM to 11:00 PM in 30-minute intervals
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 23 && minute === 30) continue;
      const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

// ============================================
// LOADING SKELETON
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="rounded-lg border bg-white dark:bg-gray-800/50 p-6 space-y-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-32" />
    </div>
  );
}

// ============================================
// DAY ROW COMPONENT
// ============================================

interface DayRowProps {
  day: { value: number; label: string };
  data: AvailabilityFormData;
  onChange: (dayOfWeek: number, updates: Partial<AvailabilityFormData>) => void;
}

function DayRow({ day, data, onChange }: DayRowProps) {
  // Abbreviated day name for mobile
  const shortDayName = day.label.slice(0, 3);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      {/* Row 1 on mobile: Day name + Toggle */}
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
        <div className="w-20 sm:w-28 shrink-0">
          <Label className="text-sm font-medium">
            <span className="sm:hidden">{shortDayName}</span>
            <span className="hidden sm:inline">{day.label}</span>
          </Label>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={data.is_available}
            onCheckedChange={(checked) => onChange(day.value, { is_available: checked })}
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 w-12 sm:w-auto">
            {data.is_available ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Row 2 on mobile: Time pickers */}
      {data.is_available ? (
        <div className="flex items-center gap-2 pl-0 sm:pl-0">
          <Select
            value={data.start_time}
            onValueChange={(value) => onChange(day.value, { start_time: value })}
          >
            <SelectTrigger className="w-[100px] sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-gray-500 dark:text-gray-400">to</span>

          <Select
            value={data.end_time}
            onValueChange={(value) => onChange(day.value, { end_time: value })}
          >
            <SelectTrigger className="w-[100px] sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500 italic sm:block hidden">
          Closed
        </span>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<AvailabilityFormData[]>(DEFAULT_AVAILABILITY);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!business) return;
      setBusinessId(business.id);

      const existingAvailability = await getAvailability(business.id);

      if (existingAvailability.length > 0) {
        // Map existing records to form data
        const formData = DAYS.map((day) => {
          const existing = existingAvailability.find((a) => a.day_of_week === day.value);
          if (existing) {
            return {
              day_of_week: existing.day_of_week,
              is_available: existing.is_available,
              start_time: existing.start_time.slice(0, 5), // Remove seconds if present
              end_time: existing.end_time.slice(0, 5),
            };
          }
          // Fallback to default for this day
          return DEFAULT_AVAILABILITY[day.value];
        });
        setAvailability(formData);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleDayChange = (dayOfWeek: number, updates: Partial<AvailabilityFormData>) => {
    setAvailability((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek ? { ...item, ...updates } : item
      )
    );
  };

  const handleSave = async () => {
    if (!businessId) return;

    // Validate end time is after start time for available days
    for (const item of availability) {
      if (item.is_available && item.end_time <= item.start_time) {
        const dayLabel = DAYS.find((d) => d.value === item.day_of_week)?.label;
        toast.error(`${dayLabel}: End time must be after start time`);
        return;
      }
    }

    setIsSaving(true);

    try {
      await saveAvailability(businessId, availability);
      toast.success('Availability saved successfully');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Availability
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Set when customers can book appointments
          </p>
        </div>

        {/* Weekly Schedule Card */}
        <div className="rounded-lg border bg-white dark:bg-gray-800/50 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Business Hours
            </h2>
          </div>

          <div className="space-y-0">
            {DAYS.map((day) => {
              const dayData = availability.find((a) => a.day_of_week === day.value);
              if (!dayData) return null;
              return (
                <DayRow
                  key={day.value}
                  day={day}
                  data={dayData}
                  onChange={handleDayChange}
                />
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </motion.div>
    </DashboardLayout>
  );
}
