// apps/web/lib/services/booking.service.ts

import { createClient } from '@/lib/supabase';
import type {
  Service,
  ServiceFormData,
  Branch,
  Availability,
  AvailabilityFormData,
  BookingWithDetails,
  BookingStatus,
  TimeSlot,
  CustomerSearchResult,
} from '@/types/booking.types';

// ============================================
// GET SERVICES
// ============================================

export async function getServices(businessId: string): Promise<Service[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// GET SERVICE BY ID
// ============================================

export async function getServiceById(id: string): Promise<Service | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching service:', error);
    return null;
  }

  return data;
}

// ============================================
// CREATE SERVICE
// ============================================

export async function createService(
  data: ServiceFormData & { business_id: string }
): Promise<Service> {
  const supabase = createClient();

  const { data: service, error } = await supabase
    .from('services')
    .insert({
      business_id: data.business_id,
      branch_id: data.branch_id,
      name: data.name,
      description: data.description || null,
      duration_minutes: data.duration_minutes,
      price_centavos: data.price ? Math.round(data.price * 100) : null,
      is_active: data.is_active,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    throw error;
  }

  return service;
}

// ============================================
// UPDATE SERVICE
// ============================================

export async function updateService(
  id: string,
  data: Partial<ServiceFormData>
): Promise<Service> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined)
    updateData.description = data.description || null;
  if (data.duration_minutes !== undefined)
    updateData.duration_minutes = data.duration_minutes;
  if (data.price !== undefined)
    updateData.price_centavos = data.price ? Math.round(data.price * 100) : null;
  if (data.branch_id !== undefined) updateData.branch_id = data.branch_id;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const { data: service, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', error);
    throw error;
  }

  return service;
}

// ============================================
// DELETE SERVICE
// ============================================

export async function deleteService(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('services').delete().eq('id', id);

  if (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
}

// ============================================
// GET BRANCHES
// ============================================

export async function getBranches(businessId: string): Promise<Branch[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('branches')
    .select('id, name, is_active')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching branches:', error);
    return [];
  }

  return data || [];
}

// ============================================
// GET AVAILABILITY
// ============================================

export async function getAvailability(businessId: string): Promise<Availability[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('business_id', businessId)
    .is('branch_id', null)
    .is('staff_id', null)
    .order('day_of_week');

  if (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }

  return data || [];
}

// ============================================
// SAVE AVAILABILITY
// ============================================

export async function saveAvailability(
  businessId: string,
  data: AvailabilityFormData[]
): Promise<void> {
  const supabase = createClient();

  // Delete existing business-level availability
  const { error: deleteError } = await supabase
    .from('availability')
    .delete()
    .eq('business_id', businessId)
    .is('branch_id', null)
    .is('staff_id', null);

  if (deleteError) {
    console.error('Error deleting availability:', deleteError);
    throw deleteError;
  }

  // Insert new records
  const records = data.map((item) => ({
    business_id: businessId,
    branch_id: null,
    staff_id: null,
    day_of_week: item.day_of_week,
    start_time: item.start_time,
    end_time: item.end_time,
    is_available: item.is_available,
  }));

  const { error: insertError } = await supabase
    .from('availability')
    .insert(records);

  if (insertError) {
    console.error('Error saving availability:', insertError);
    throw insertError;
  }
}

// ============================================
// GET BOOKINGS
// ============================================

export async function getBookings(
  businessId: string,
  date: string
): Promise<BookingWithDetails[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services(*)
    `)
    .eq('business_id', businessId)
    .eq('booking_date', date)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return (data || []) as BookingWithDetails[];
}

// ============================================
// UPDATE BOOKING STATUS
// ============================================

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  cancellationReason?: string
): Promise<void> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = { status };

  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString();
    if (cancellationReason) {
      updateData.cancellation_reason = cancellationReason;
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

// ============================================
// CREATE BOOKING
// ============================================

interface CreateBookingData {
  business_id: string;
  service_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  staff_id: string | null;
  notes: string | null;
  status: BookingStatus;
}

export async function createBooking(data: CreateBookingData): Promise<BookingWithDetails> {
  const supabase = createClient();

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      business_id: data.business_id,
      service_id: data.service_id,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      booking_date: data.booking_date,
      start_time: data.start_time,
      end_time: data.end_time,
      staff_id: data.staff_id,
      notes: data.notes,
      status: data.status,
    })
    .select(`
      *,
      service:services(*)
    `)
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  return booking as BookingWithDetails;
}

// ============================================
// GET AVAILABLE TIME SLOTS
// ============================================

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  return start1Min < end2Min && end1Min > start2Min;
}

export async function getAvailableTimeSlots(
  businessId: string,
  date: string,
  serviceDurationMinutes: number
): Promise<TimeSlot[]> {
  const supabase = createClient();

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = new Date(date).getDay();

  // Fetch availability for that day
  const { data: availabilityData } = await supabase
    .from('availability')
    .select('*')
    .eq('business_id', businessId)
    .eq('day_of_week', dayOfWeek)
    .is('branch_id', null)
    .is('staff_id', null)
    .single();

  if (!availabilityData || !availabilityData.is_available) {
    return [];
  }

  // Generate 30-minute slots within business hours
  const slots: TimeSlot[] = [];
  const startMinutes = timeToMinutes(availabilityData.start_time);
  const endMinutes = timeToMinutes(availabilityData.end_time);

  for (let minutes = startMinutes; minutes + serviceDurationMinutes <= endMinutes; minutes += 30) {
    const timeValue = minutesToTime(minutes);
    slots.push({
      value: timeValue,
      label: formatTimeForDisplay(timeValue),
      available: true,
    });
  }

  // Fetch existing bookings for that date (excluding cancelled)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_time, end_time, status')
    .eq('business_id', businessId)
    .eq('booking_date', date)
    .neq('status', 'cancelled');

  if (!bookings || bookings.length === 0) {
    return slots;
  }

  // Mark slots that conflict with existing bookings
  return slots.map((slot) => {
    const slotEndTime = minutesToTime(timeToMinutes(slot.value) + serviceDurationMinutes);
    const hasConflict = bookings.some((booking) =>
      timesOverlap(slot.value, slotEndTime, booking.start_time, booking.end_time)
    );

    return {
      ...slot,
      available: !hasConflict,
    };
  });
}

// ============================================
// SEARCH CUSTOMERS
// ============================================

export async function searchCustomers(
  businessId: string,
  query: string
): Promise<CustomerSearchResult[]> {
  const supabase = createClient();

  const searchQuery = query.toLowerCase().trim();

  if (!searchQuery) {
    // Return recent customers
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, phone, email')
      .eq('created_by_business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    // Map full_name to name for the interface
    return (data || []).map(c => ({
      id: c.id,
      name: c.full_name || '',
      phone: c.phone,
      email: c.email,
    }));
  }

  // Search by name or phone
  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, phone, email')
    .eq('created_by_business_id', businessId)
    .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
    .limit(10);

  if (error) {
    console.error('Error searching customers:', error);
    return [];
  }

  // Map full_name to name for the interface
  return (data || []).map(c => ({
    id: c.id,
    name: c.full_name || '',
    phone: c.phone,
    email: c.email,
  }));
}
