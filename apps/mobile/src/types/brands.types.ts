// src/types/brands.types.ts

export interface BrandBranch {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
}

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  points_per_purchase: number | null;
  branches: BrandBranch[];
  reward_count: number;
}

export interface BrandFromSupabase {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  points_per_purchase: number | null;
  branches: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    is_active: boolean;
  }[];
  rewards: { id: string }[];
}
