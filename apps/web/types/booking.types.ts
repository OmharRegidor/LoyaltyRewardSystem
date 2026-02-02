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
