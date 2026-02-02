// apps/web/components/booking/booking-detail-dialog.tsx

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, User, Phone, Mail, Clock, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { updateBookingStatus } from '@/lib/services/booking.service';
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

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No Show' },
];

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
  if (centavos === null) return 'Free';
  return `₱${(centavos / 100).toFixed(0)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
  return `${hours} hr ${remainingMinutes} min`;
}

// ============================================
// TYPES
// ============================================

interface BookingDetailDialogProps {
  booking: BookingWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
}

// ============================================
// COMPONENT
// ============================================

export function BookingDetailDialog({
  booking,
  isOpen,
  onClose,
  onStatusChange,
}: BookingDetailDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!booking) return null;

  const customerName = booking.customer_name || 'Guest';
  const statusConfig = STATUS_CONFIG[booking.status];

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (newStatus === booking.status) return;

    setIsUpdating(true);
    try {
      await updateBookingStatus(booking.id, newStatus);
      onStatusChange(booking.id, newStatus);
      toast.success(`Booking marked as ${STATUS_CONFIG[newStatus].label.toLowerCase()}`);
    } catch {
      toast.error('Failed to update booking status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    setIsUpdating(true);
    try {
      await updateBookingStatus(booking.id, 'cancelled');
      onStatusChange(booking.id, 'cancelled');
      toast.success('Booking cancelled');
      setShowCancelConfirm(false);
      onClose();
    } catch {
      toast.error('Failed to cancel booking');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Info */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Customer
              </Label>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{customerName}</span>
                </div>
                {booking.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {booking.customer_phone}
                    </span>
                  </div>
                )}
                {booking.customer_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {booking.customer_email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Service Info */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Service
              </Label>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium">{booking.service.name}</div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span>{formatDuration(booking.service.duration_minutes)}</span>
                  <span>•</span>
                  <span>{formatPrice(booking.service.price_centavos)}</span>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Schedule
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(booking.booking_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Status
              </Label>
              {booking.status === 'cancelled' ? (
                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
              ) : (
                <Select
                  value={booking.status}
                  onValueChange={(value) => handleStatusChange(value as BookingStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>
                      <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Notes
                </Label>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Cancellation Info */}
            {booking.status === 'cancelled' && booking.cancelled_at && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 text-sm">
                <div className="text-red-600 dark:text-red-400">
                  Cancelled on{' '}
                  {new Date(booking.cancelled_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                {booking.cancellation_reason && (
                  <div className="text-red-500/80 dark:text-red-400/80 mt-1">
                    Reason: {booking.cancellation_reason}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isUpdating}
              >
                Cancel Booking
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking for {customerName}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
