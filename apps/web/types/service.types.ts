// apps/web/types/service.types.ts

// ============================================
// PRICING TYPES
// ============================================

export type PricingType =
  | 'fixed'
  | 'per_hour'
  | 'per_session'
  | 'per_person'
  | 'per_night'
  | 'per_day'
  | 'starting_at';

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  fixed: 'Fixed',
  per_hour: 'Per Hour',
  per_session: 'Per Session',
  per_person: 'Per Person',
  per_night: 'Per Night',
  per_day: 'Per Day',
  starting_at: 'Starting At',
};

// ============================================
// DURATION TYPES
// ============================================

export type DurationUnit = 'minutes' | 'hours' | 'days' | 'nights';

export const DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
  minutes: 'Minutes',
  hours: 'Hours',
  days: 'Days',
  nights: 'Nights',
};

// ============================================
// SERVICE TYPES
// ============================================

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  duration_unit: DurationUnit;
  price_centavos: number;
  is_active: boolean;
  image_url: string | null;
  category: string | null;
  pricing_type: PricingType;
  max_guests: number | null;
  allow_staff_selection: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFormData {
  name: string;
  description?: string;
  price: number; // In pesos - converted to centavos on save
  pricing_type: PricingType;
  duration_minutes: number;
  duration_unit: DurationUnit;
  category?: string;
  image_url?: string;
  is_active: boolean;
  max_guests?: number;
  allow_staff_selection: boolean;
  staff_ids?: string[];
}
