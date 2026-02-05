// apps/web/types/booking.types.ts

export interface Service {
  id: string;
  business_id: string;
  branch_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_centavos: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number | null; // UI uses pesos, convert to centavos on save
  branch_id: string | null;
  is_active: boolean;
  image_url?: string;
}

export interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Availability {
  id: string;
  business_id: string;
  branch_id: string | null;
  staff_id: string | null;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // "09:00"
  end_time: string; // "18:00"
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityFormData {
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
}

// ============================================
// BOOKING TYPES
// ============================================

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  business_id: string;
  branch_id: string | null;
  service_id: string;
  staff_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  service?: Service;
}

export interface BookingWithDetails extends Booking {
  service: Service;
}

// ============================================
// CREATE BOOKING TYPES
// ============================================

export interface CreateBookingFormData {
  service_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  booking_date: string;
  start_time: string;
  staff_id: string | null;
  notes: string | null;
}

export interface TimeSlot {
  value: string; // "09:00"
  label: string; // "9:00 AM"
  available: boolean;
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}
