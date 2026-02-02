// apps/web/app/dashboard/booking/page.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { BookingDetailDialog } from '@/components/booking/booking-detail-dialog';
import { CreateBookingModal } from '@/components/booking/create-booking-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase';
import { getBookings } from '@/lib/services/booking.service';
import { motion } from 'framer-motion';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  CalendarDays,
} from 'lucide-react';
import type { BookingWithDetails, BookingStatus } from '@/types/booking.types';

// ============================================
// CONSTANTS
// ============================================

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  },
  no_show: {
    label: 'No Show',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

// Generate time slots from 6:00 AM to 10:00 PM in 30-minute intervals
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 22) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

// ============================================
// HELPERS
// ============================================

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function formatPrice(centavos: number | null): string {
  if (centavos === null) return '-';
  return `₱${(centavos / 100).toFixed(0)}`;
}

function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      <div className="rounded-lg border bg-white dark:bg-gray-800/50 p-4">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        No bookings for this day
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        There are no appointments scheduled. Bookings will appear here when customers
        make reservations.
      </p>
    </div>
  );
}

// ============================================
// DAY VIEW COMPONENT
// ============================================

interface DayViewProps {
  bookings: BookingWithDetails[];
  onBookingClick: (booking: BookingWithDetails) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
}

function DayView({ bookings, onBookingClick, onStatusChange }: DayViewProps) {
  // Group bookings by their start time slot
  const bookingsBySlot = useMemo(() => {
    const map = new Map<string, BookingWithDetails[]>();
    bookings.forEach((booking) => {
      const slotTime = booking.start_time.slice(0, 5);
      const existing = map.get(slotTime) || [];
      map.set(slotTime, [...existing, booking]);
    });
    return map;
  }, [bookings]);

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800/50">
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {TIME_SLOTS.map((slot) => {
          const slotBookings = bookingsBySlot.get(slot) || [];
          const hasBookings = slotBookings.length > 0;

          return (
            <div
              key={slot}
              className={`flex min-h-[60px] ${
                hasBookings ? 'bg-white dark:bg-gray-800/50' : 'bg-gray-50/50 dark:bg-gray-900/20'
              }`}
            >
              <div className="w-20 shrink-0 py-2 px-3 text-right border-r border-gray-100 dark:border-gray-700">
                <span className="text-sm text-muted-foreground">{formatTime(slot)}</span>
              </div>
              <div className="flex-1 p-2">
                {slotBookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => onBookingClick(booking)}
                    className="w-full text-left p-2 rounded-md bg-primary/10 hover:bg-primary/15 transition-colors mb-1 last:mb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {booking.customer_name || 'Guest'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {booking.service.name}
                        </div>
                      </div>
                      <Badge className={STATUS_CONFIG[booking.status].className}>
                        {STATUS_CONFIG[booking.status].label}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// LIST VIEW COMPONENT
// ============================================

interface ListViewProps {
  bookings: BookingWithDetails[];
  onBookingClick: (booking: BookingWithDetails) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
}

function ListView({ bookings, onBookingClick, onStatusChange }: ListViewProps) {
  const handleStatusChange = async (booking: BookingWithDetails, newStatus: BookingStatus) => {
    if (newStatus === booking.status) return;

    const { updateBookingStatus } = await import('@/lib/services/booking.service');
    try {
      await updateBookingStatus(booking.id, newStatus);
      onStatusChange(booking.id, newStatus);
    } catch {
      // Error handled in service
    }
  };

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800/50 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
              Time
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
              Customer
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
              Service
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
              Price
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {bookings.map((booking) => (
            <tr
              key={booking.id}
              onClick={() => onBookingClick(booking)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <span className="text-sm font-medium">
                  {formatTime(booking.start_time)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm">{booking.customer_name || 'Guest'}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  {booking.service.name}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm">
                  {formatPrice(booking.service.price_centavos)}
                </span>
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                {booking.status === 'cancelled' ? (
                  <Badge className={STATUS_CONFIG[booking.status].className}>
                    {STATUS_CONFIG[booking.status].label}
                  </Badge>
                ) : (
                  <Select
                    value={booking.status}
                    onValueChange={(value) =>
                      handleStatusChange(booking, value as BookingStatus)
                    }
                  >
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue>
                        <Badge className={STATUS_CONFIG[booking.status].className}>
                          {STATUS_CONFIG[booking.status].label}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'list'>('day');
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    loadBusinessId();
  }, []);

  useEffect(() => {
    if (businessId) {
      loadBookings();
    }
  }, [businessId, selectedDate]);

  const loadBusinessId = async () => {
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

      if (business) {
        setBusinessId(business.id);
      }
    } catch (error) {
      console.error('Error loading business:', error);
      setIsLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!businessId) return;

    setIsLoading(true);
    try {
      const data = await getBookings(businessId, formatDateForAPI(selectedDate));
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // DATE NAVIGATION
  // ============================================

  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleBookingClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const handleStatusChange = (id: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );

    // Update selected booking if it's the one being modified
    if (selectedBooking?.id === id) {
      setSelectedBooking((prev) => (prev ? { ...prev, status } : null));
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading && !businessId) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bookings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage customer appointments
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* View Toggle */}
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as 'day' | 'list')}
          >
            <TabsList>
              <TabsTrigger value="day">
                <CalendarDays className="w-4 h-4 mr-1.5" />
                Day
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="w-4 h-4 mr-1.5" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousDay}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={isToday(selectedDate) ? 'default' : 'outline'}
              onClick={goToToday}
              className="min-w-[80px]"
            >
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextDay}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Date Display */}
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatDateDisplay(selectedDate)}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="rounded-lg border bg-white dark:bg-gray-800/50 p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'day' ? (
          <DayView
            bookings={bookings}
            onBookingClick={handleBookingClick}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <ListView
            bookings={bookings}
            onBookingClick={handleBookingClick}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Booking Detail Dialog */}
        <BookingDetailDialog
          booking={selectedBooking}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedBooking(null);
          }}
          onStatusChange={handleStatusChange}
        />

        {/* Create Booking Modal */}
        {businessId && (
          <CreateBookingModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              loadBookings();
            }}
            businessId={businessId}
          />
        )}
      </motion.div>
    </DashboardLayout>
  );
}
