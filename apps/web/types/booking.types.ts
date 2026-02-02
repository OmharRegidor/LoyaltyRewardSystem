// apps/web/types/booking.types.ts

export interface Service {
  id: string;
  business_id: string;
  branch_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_centavos: number | null;
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
