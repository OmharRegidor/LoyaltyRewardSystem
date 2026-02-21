// apps/web/components/booking/create-booking-modal.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, CalendarIcon, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  getServices,
  getAvailableTimeSlots,
  searchCustomers,
  createBooking,
} from '@/lib/services/booking.service';
import type {
  Service,
  TimeSlot,
  CustomerSearchResult,
} from '@/types/booking.types';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
}

interface FormState {
  service_id: string;
  customer_mode: 'existing' | 'new';
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  booking_date: Date | undefined;
  start_time: string;
  staff_id: string;
  notes: string;
}

const INITIAL_FORM_STATE: FormState = {
  service_id: '',
  customer_mode: 'existing',
  customer_id: '',
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  booking_date: new Date(),
  start_time: '',
  staff_id: '',
  notes: '',
};

// ============================================
// HELPERS
// ============================================

function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPrice(centavos: number | null): string {
  if (centavos === null) return '';
  return `₱${(centavos / 100).toFixed(0)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMins} min`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

// ============================================
// COMPONENT
// ============================================

export function CreateBookingModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
}: CreateBookingModalProps) {
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get selected service
  const selectedService = useMemo(
    () => services.find((s) => s.id === formData.service_id),
    [services, formData.service_id]
  );

  // Filter active services
  const activeServices = useMemo(
    () => services.filter((s) => s.is_active),
    [services]
  );

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const query = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query)
    );
  }, [customers, customerSearch]);

  // ============================================
  // EFFECTS
  // ============================================

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM_STATE);
      setTimeSlots([]);
      setCustomerSearch('');
      loadServices();
      loadCustomers('');
    }
  }, [isOpen, businessId]);

  // Load time slots when date or service changes
  useEffect(() => {
    if (formData.booking_date && formData.service_id && selectedService) {
      loadTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [formData.booking_date, formData.service_id, selectedService]);

  // ============================================
  // DATA LOADING
  // ============================================

  const loadServices = async () => {
    setIsLoadingServices(true);
    try {
      const data = await getServices(businessId);
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadTimeSlots = async () => {
    if (!formData.booking_date || !selectedService) return;

    setIsLoadingSlots(true);
    setFormData((prev) => ({ ...prev, start_time: '' })); // Clear selected time

    try {
      const slots = await getAvailableTimeSlots(
        businessId,
        formatDateForAPI(formData.booking_date),
        selectedService.duration_minutes
      );
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      toast.error('Failed to load available times');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const loadCustomers = async (query: string) => {
    setIsLoadingCustomers(true);
    try {
      const data = await searchCustomers(businessId, query);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleServiceChange = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      service_id: serviceId,
      start_time: '', // Clear time when service changes
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      booking_date: date,
      start_time: '', // Clear time when date changes
    }));
    setIsCalendarOpen(false);
  };

  const handleCustomerModeChange = (mode: string) => {
    setFormData((prev) => ({
      ...prev,
      customer_mode: mode as 'existing' | 'new',
      customer_id: '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.service_id) {
      toast.error('Please select a service');
      return;
    }

    if (!formData.booking_date) {
      toast.error('Please select a date');
      return;
    }

    if (!formData.start_time) {
      toast.error('Please select a time');
      return;
    }

    if (formData.customer_mode === 'existing' && !formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    if (
      formData.customer_mode === 'new' &&
      (!formData.customer_name.trim() || !formData.customer_phone.trim())
    ) {
      toast.error('Please enter customer name and phone');
      return;
    }

    if (!selectedService) {
      toast.error('Invalid service selected');
      return;
    }

    setIsSubmitting(true);

    try {
      const endTime = addMinutesToTime(
        formData.start_time,
        selectedService.duration_minutes
      );

      await createBooking({
        business_id: businessId,
        service_id: formData.service_id,
        customer_id:
          formData.customer_mode === 'existing' ? formData.customer_id : null,
        customer_name:
          formData.customer_mode === 'new' ? formData.customer_name.trim() : null,
        customer_phone:
          formData.customer_mode === 'new' ? formData.customer_phone.trim() : null,
        customer_email:
          formData.customer_mode === 'new' && formData.customer_email.trim()
            ? formData.customer_email.trim()
            : null,
        booking_date: formatDateForAPI(formData.booking_date),
        start_time: formData.start_time,
        end_time: endTime,
        staff_id: formData.staff_id || null,
        notes: formData.notes.trim() || null,
        status: 'confirmed',
      });

      toast.success('Booking created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const availableSlots = timeSlots.filter((s) => s.available);
  const selectedCustomer = customers.find((c) => c.id === formData.customer_id);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Booking</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new booking by selecting a service, customer, date and time
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            <Select
              value={formData.service_id}
              onValueChange={handleServiceChange}
              disabled={isLoadingServices}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {activeServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <span className="flex items-center gap-2">
                      <span>{service.name}</span>
                      <span className="text-gray-500 text-xs">
                        {formatDuration(service.duration_minutes)}
                        {service.price_centavos !== null &&
                          ` • ${formatPrice(service.price_centavos)}`}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Section */}
          <div className="space-y-3">
            <Label>Customer</Label>
            <Tabs
              value={formData.customer_mode}
              onValueChange={handleCustomerModeChange}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing Customer</TabsTrigger>
                <TabsTrigger value="new">New Customer</TabsTrigger>
              </TabsList>
            </Tabs>

            {formData.customer_mode === 'existing' ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, customer_id: value }))
                  }
                  disabled={isLoadingCustomers}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a customer">
                      {selectedCustomer && (
                        <span>
                          {selectedCustomer.name}
                          {selectedCustomer.phone && ` • ${selectedCustomer.phone}`}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCustomers.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-gray-500">
                        No customers found
                      </div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <span>
                            {customer.name}
                            {customer.phone && (
                              <span className="text-gray-500 ml-2">
                                {customer.phone}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer_name: e.target.value,
                      }))
                    }
                    placeholder="Customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Phone *</Label>
                  <Input
                    id="customer_phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer_phone: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                    onKeyDown={(e) => {
                      if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
                      if (!/^\d$/.test(e.key)) e.preventDefault();
                    }}
                    placeholder="e.g., 09171234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_email">Email (optional)</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer_email: e.target.value,
                      }))
                    }
                    placeholder="customer@example.com"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.booking_date && 'text-gray-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.booking_date
                    ? formatDateDisplay(formData.booking_date)
                    : 'Select a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.booking_date}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Time *</Label>
            {!formData.service_id ? (
              <p className="text-sm text-gray-500">
                Select a service first
              </p>
            ) : !formData.booking_date ? (
              <p className="text-sm text-gray-500">Select a date first</p>
            ) : isLoadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available times...
              </div>
            ) : timeSlots.length === 0 ? (
              <p className="text-sm text-gray-500">
                No available times on this day. The business may be closed.
              </p>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-gray-500">
                All time slots are booked for this day.
              </p>
            ) : (
              <Select
                value={formData.start_time}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, start_time: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem
                      key={slot.value}
                      value={slot.value}
                      disabled={!slot.available}
                    >
                      <span
                        className={cn(!slot.available && 'text-gray-500')}
                      >
                        {slot.label}
                        {!slot.available && ' (Booked)'}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Any special requests or notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
