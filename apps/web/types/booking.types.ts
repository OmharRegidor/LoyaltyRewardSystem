// apps/web/types/booking.types.ts

// ============================================
// BUSINESS TYPE ENUMS
// ============================================

export type BusinessType = 'retail' | 'restaurant' | 'salon' | 'hotel';

export type PricingType = 'fixed' | 'per_hour' | 'per_session' | 'per_night' | 'starting_at';

export type QuestionType = 'text' | 'select' | 'checkbox' | 'number';

// ============================================
// SERVICE CONFIG BY BUSINESS TYPE
// ============================================

export interface RetailConfig {
  service_type: 'appointment' | 'pickup' | 'reservation';
}

export interface RestaurantConfig {
  service_type: 'table' | 'private_dining' | 'event';
  party_size_min: number;
  party_size_max: number;
  slot_duration_minutes: number;
  time_interval_minutes: number;
}

export interface HotelConfig {
  service_type: 'accommodation' | 'tour' | 'activity';
  extra_person_fee_centavos: number;
  capacity_base: number;
  capacity_max: number;
  check_in_time: string;
  check_out_time: string;
  amenities: string[];
  min_stay_nights: number;
  max_stay_nights: number;
  advance_booking_days: number;
  cutoff_hours: number;
  enable_diving_addons?: boolean;
}

export type ServiceConfig = RetailConfig | RestaurantConfig | HotelConfig | Record<string, unknown>;

// ============================================
// PRICE VARIANTS
// ============================================

export interface PriceVariant {
  id?: string;
  service_id?: string;
  name: string;
  price_centavos: number;
  description: string | null;
  capacity: number | null;
  sort_order: number;
  is_active: boolean;
}

// ============================================
// SERVICE QUESTIONS
// ============================================

export interface ServiceQuestion {
  id?: string;
  service_id?: string;
  question: string;
  question_type: QuestionType;
  options: string[];
  is_required: boolean;
  sort_order: number;
}

// ============================================
// SERVICE TYPES
// ============================================

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
  // New configuration fields
  config?: ServiceConfig;
  category?: string | null;
  buffer_minutes?: number;
  pricing_type?: PricingType;
  deposit_percentage?: number;
  allow_staff_selection?: boolean;
  inventory_count?: number;
}

export interface ServiceWithConfig extends Service {
  config: ServiceConfig;
  category: string | null;
  buffer_minutes: number;
  pricing_type: PricingType;
  deposit_percentage: number;
  allow_staff_selection: boolean;
  inventory_count: number;
  price_variants?: PriceVariant[];
  questions?: ServiceQuestion[];
}

export interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number | null; // UI uses pesos, convert to centavos on save
  branch_id: string | null;
  is_active: boolean;
  image_url?: string;
  // New configuration fields
  config?: ServiceConfig;
  category?: string | null;
  buffer_minutes?: number;
  pricing_type?: PricingType;
  deposit_percentage?: number;
  allow_staff_selection?: boolean;
  inventory_count?: number;
  // Related data
  price_variants?: PriceVariant[];
  questions?: ServiceQuestion[];
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

// ============================================
// PUBLIC BOOKING FORM TYPES
// ============================================

export interface PublicPriceVariant {
  id: string;
  name: string;
  price_centavos: number;
  description: string | null;
  capacity: number | null;
}

export interface AddonOption {
  id: string;
  addon_id: string;
  name: string;
  price_centavos: number;
  description: string | null;
}

export interface PublicAddon {
  id: string;
  name: string;
  description: string | null;
  price_centavos: number;
  duration_minutes: number | null;
  category: string | null;
  options: AddonOption[];
}

export interface PublicServiceWithConfig {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_centavos: number | null;
  pricing_type: PricingType | null;
  config: ServiceConfig | null;
  price_variants: PublicPriceVariant[];
}
